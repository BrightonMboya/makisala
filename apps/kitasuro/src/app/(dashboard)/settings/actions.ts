'use server';

import { db, organizations, user, member, invitation } from '@repo/db';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Helper: Get authenticated session with active organization
async function getSessionWithOrg() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return null;
  }

  // First try session's activeOrganizationId (set by Better Auth organization plugin)
  let orgId = session.session?.activeOrganizationId as string | undefined;

  // Fallback: look up user's first organization from member table
  if (!orgId) {
    const [membership] = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(eq(member.userId, session.user.id))
      .limit(1);

    orgId = membership?.organizationId ?? undefined;
  }

  if (!orgId) {
    return null;
  }

  return {
    user: session.user,
    orgId,
  };
}

// Helper: Check if user is admin in the active organization
async function requireAdmin() {
  const session = await getSessionWithOrg();
  if (!session) {
    throw new Error('Unauthorized: Not logged in or no active organization');
  }

  const [membership] = await db
    .select({ role: member.role })
    .from(member)
    .where(
      and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, session.orgId)
      )
    )
    .limit(1);

  if (membership?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }

  return session;
}

// === ORGANIZATION SETTINGS ===

export async function getOrganizationSettings() {
  const session = await getSessionWithOrg();
  if (!session) return null;

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, session.orgId))
    .limit(1);

  return org || null;
}

export async function updateOrganizationSettings(data: {
  name?: string;
  logoUrl?: string;
  primaryColor?: string;
  notificationEmail?: string;
}) {
  const session = await requireAdmin();

  await db
    .update(organizations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(organizations.id, session.orgId));

  revalidatePath('/settings');
  return { success: true };
}

// === TEAM MANAGEMENT ===

export async function getTeamMembers() {
  const session = await getSessionWithOrg();
  if (!session) return [];

  // Join member table with user table to get member details
  const members = await db
    .select({
      id: member.id,
      memberId: member.id,
      userId: member.userId,
      name: user.name,
      email: user.email,
      role: member.role,
      image: user.image,
      createdAt: member.createdAt,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, session.orgId))
    .orderBy(desc(member.createdAt));

  return members;
}

export async function getPendingInvitations() {
  const session = await getSessionWithOrg();
  if (!session) return [];

  const invitations = await db
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      inviterId: invitation.inviterId,
    })
    .from(invitation)
    .where(
      and(
        eq(invitation.organizationId, session.orgId),
        eq(invitation.status, 'pending')
      )
    )
    .orderBy(desc(invitation.createdAt));

  // Get inviter names
  const inviterIds = invitations
    .map((inv) => inv.inviterId)
    .filter((id): id is string => id !== null);

  const uniqueInviterIds = [...new Set(inviterIds)];
  const inviters =
    uniqueInviterIds.length > 0
      ? await db
          .select({ id: user.id, name: user.name })
          .from(user)
          .where(inArray(user.id, uniqueInviterIds))
      : [];

  const inviterMap = new Map(inviters.map((u) => [u.id, u.name]));

  return invitations.map((inv) => ({
    ...inv,
    inviter: { name: inv.inviterId ? inviterMap.get(inv.inviterId) || 'Unknown' : 'Unknown' },
  }));
}

export async function inviteTeamMember(data: { email: string; role: 'admin' | 'member' }) {
  const session = await requireAdmin();
  const hdrs = await headers();

  try {
    // Use Better Auth's organization invite API
    const result = await auth.api.createInvitation({
      body: {
        email: data.email,
        role: data.role,
        organizationId: session.orgId,
      },
      headers: hdrs,
    });

    revalidatePath('/settings');
    return { success: true, invitation: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send invitation';
    return { success: false, error: message };
  }
}

export async function revokeInvitation(invitationId: string) {
  const session = await requireAdmin();
  const hdrs = await headers();

  try {
    await auth.api.cancelInvitation({
      body: { invitationId },
      headers: hdrs,
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to revoke invitation';
    return { success: false, error: message };
  }
}

export async function removeTeamMember(memberId: string) {
  const session = await requireAdmin();
  const hdrs = await headers();

  // Get the member to check if it's the current user
  const [memberData] = await db
    .select({ userId: member.userId })
    .from(member)
    .where(eq(member.id, memberId))
    .limit(1);

  if (memberData?.userId === session.user.id) {
    return { success: false, error: 'You cannot remove yourself from the team' };
  }

  try {
    await auth.api.removeMember({
      body: {
        memberIdOrEmail: memberId,
        organizationId: session.orgId,
      },
      headers: hdrs,
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to remove member';
    return { success: false, error: message };
  }
}

export async function updateMemberRole(memberId: string, role: 'admin' | 'member') {
  const session = await requireAdmin();
  const hdrs = await headers();

  // Get the member to check if it's the current user and count admins
  const [memberData] = await db
    .select({ userId: member.userId })
    .from(member)
    .where(eq(member.id, memberId))
    .limit(1);

  if (memberData?.userId === session.user.id && role === 'member') {
    const adminCount = await db
      .select()
      .from(member)
      .where(
        and(
          eq(member.organizationId, session.orgId),
          eq(member.role, 'admin')
        )
      );

    if (adminCount.length <= 1) {
      return { success: false, error: 'Cannot demote: You are the only admin' };
    }
  }

  try {
    await auth.api.updateMemberRole({
      body: {
        memberId,
        role,
        organizationId: session.orgId,
      },
      headers: hdrs,
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update role';
    return { success: false, error: message };
  }
}

// === PROFILE ===

export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  const [userData] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);

  return userData || null;
}

export async function updateUserProfile(data: { name: string; image?: string }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db
    .update(user)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(user.id, session.user.id));

  revalidatePath('/settings');
  return { success: true };
}

// === INVITATION ACCEPTANCE ===

// Get just the status of an invitation (for checking if already accepted)
export async function getInvitationStatus(invitationId: string) {
  const [inv] = await db
    .select({ status: invitation.status })
    .from(invitation)
    .where(eq(invitation.id, invitationId))
    .limit(1);

  return inv?.status || null;
}

export async function getInvitationByToken(invitationId: string) {
  const [inv] = await db
    .select()
    .from(invitation)
    .where(and(eq(invitation.id, invitationId), eq(invitation.status, 'pending')))
    .limit(1);

  if (!inv) return null;

  if (new Date(inv.expiresAt) < new Date()) {
    // Mark as expired
    await db
      .update(invitation)
      .set({ status: 'canceled' })
      .where(eq(invitation.id, inv.id));
    return null;
  }

  // Get organization and inviter details in parallel
  const [[org], [inviter]] = await Promise.all([
    db
      .select({ name: organizations.name, logoUrl: organizations.logoUrl })
      .from(organizations)
      .where(eq(organizations.id, inv.organizationId))
      .limit(1),
    inv.inviterId
      ? db
          .select({ name: user.name })
          .from(user)
          .where(eq(user.id, inv.inviterId))
          .limit(1)
      : Promise.resolve([null]),
  ]);

  return {
    ...inv,
    organization: org || null,
    inviter: inviter || null,
  };
}

export async function acceptInvitation(invitationId: string) {
  const hdrs = await headers();

  try {
    // Get the invitation to know which organization to switch to
    const [inv] = await db
      .select({ organizationId: invitation.organizationId })
      .from(invitation)
      .where(eq(invitation.id, invitationId))
      .limit(1);

    if (!inv) {
      return { success: false, error: 'Invitation not found' };
    }

    // Accept the invitation (adds user to organization)
    await auth.api.acceptInvitation({
      body: { invitationId },
      headers: hdrs,
    });

    // Set the active organization to the invited org so user is switched to it
    await auth.api.setActiveOrganization({
      body: { organizationId: inv.organizationId },
      headers: hdrs,
    });

    // Revalidate settings page so admin sees updated invitation status
    revalidatePath('/settings');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid or expired invitation';
    return { success: false, error: message };
  }
}

// === UTILITY: Check Admin Status ===

export async function checkIsAdmin() {
  const session = await getSessionWithOrg();
  if (!session) return false;

  const [membership] = await db
    .select({ role: member.role })
    .from(member)
    .where(
      and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, session.orgId)
      )
    )
    .limit(1);

  return membership?.role === 'admin';
}
