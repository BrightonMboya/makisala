'use server';

import { db, organizations, user, teamInvitations } from '@repo/db';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { sendTeamInvitationEmail } from '@repo/resend';
import { randomBytes } from 'crypto';
import { env } from '@/lib/env';

// Helper: Get authenticated session
async function getSession() {
  return await auth.api.getSession({ headers: await headers() });
}

// Helper: Check if user is admin
async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.organizationId) {
    throw new Error('Unauthorized: Not logged in');
  }

  const [userData] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (userData?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }

  return session;
}

// === ORGANIZATION SETTINGS ===

export async function getOrganizationSettings() {
  const session = await getSession();
  if (!session?.user?.organizationId) return null;

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, session.user.organizationId))
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
    .where(eq(organizations.id, session.user.organizationId));

  revalidatePath('/settings');
  return { success: true };
}

// === TEAM MANAGEMENT ===

export async function getTeamMembers() {
  const session = await getSession();
  if (!session?.user?.organizationId) return [];

  return await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.organizationId, session.user.organizationId))
    .orderBy(desc(user.createdAt));
}

export async function getPendingInvitations() {
  const session = await getSession();
  if (!session?.user?.organizationId) return [];

  const invitations = await db
    .select({
      id: teamInvitations.id,
      email: teamInvitations.email,
      role: teamInvitations.role,
      expiresAt: teamInvitations.expiresAt,
      createdAt: teamInvitations.createdAt,
      invitedBy: teamInvitations.invitedBy,
    })
    .from(teamInvitations)
    .where(
      and(
        eq(teamInvitations.organizationId, session.user.organizationId),
        eq(teamInvitations.status, 'pending')
      )
    )
    .orderBy(desc(teamInvitations.createdAt));

  // Get inviter names
  const inviterIds = [...new Set(invitations.map((inv) => inv.invitedBy))];
  const inviters = inviterIds.length > 0
    ? await db
        .select({ id: user.id, name: user.name })
        .from(user)
        .where(inArray(user.id, inviterIds))
    : [];

  const inviterMap = new Map(inviters.map((u) => [u.id, u.name]));

  return invitations.map((inv) => ({
    ...inv,
    inviter: { name: inviterMap.get(inv.invitedBy) || 'Unknown' },
  }));
}

export async function inviteTeamMember(data: { email: string; role: 'admin' | 'member' }) {
  const session = await requireAdmin();

  // Check if user already exists in organization
  const existingUser = await db
    .select()
    .from(user)
    .where(and(eq(user.email, data.email), eq(user.organizationId, session.user.organizationId)))
    .limit(1);

  if (existingUser.length > 0) {
    return { success: false, error: 'User is already a team member' };
  }

  // Check for existing pending invitation
  const existingInvitation = await db
    .select()
    .from(teamInvitations)
    .where(
      and(
        eq(teamInvitations.email, data.email),
        eq(teamInvitations.organizationId, session.user.organizationId),
        eq(teamInvitations.status, 'pending')
      )
    )
    .limit(1);

  if (existingInvitation.length > 0) {
    return { success: false, error: 'An invitation is already pending for this email' };
  }

  // Generate unique token
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Create invitation
  const [invitation] = await db
    .insert(teamInvitations)
    .values({
      organizationId: session.user.organizationId,
      email: data.email,
      role: data.role,
      token,
      invitedBy: session.user.id,
      expiresAt,
    })
    .returning();

  // Get organization details for email
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, session.user.organizationId))
    .limit(1);

  // Send invitation email
  const inviteUrl = `${env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

  await sendTeamInvitationEmail({
    recipientEmail: data.email,
    inviterName: session.user.name,
    organizationName: org?.name || 'Your Organization',
    role: data.role,
    inviteUrl,
    expiresAt: expiresAt.toLocaleDateString(),
  });

  revalidatePath('/settings');
  return { success: true, invitation };
}

export async function revokeInvitation(invitationId: string) {
  const session = await requireAdmin();

  await db
    .update(teamInvitations)
    .set({ status: 'revoked' })
    .where(
      and(
        eq(teamInvitations.id, invitationId),
        eq(teamInvitations.organizationId, session.user.organizationId)
      )
    );

  revalidatePath('/settings');
  return { success: true };
}

export async function removeTeamMember(memberId: string) {
  const session = await requireAdmin();

  // Prevent removing yourself
  if (memberId === session.user.id) {
    return { success: false, error: 'You cannot remove yourself from the team' };
  }

  // Remove user from organization (set organizationId to null)
  await db
    .update(user)
    .set({ organizationId: null, role: 'member' })
    .where(and(eq(user.id, memberId), eq(user.organizationId, session.user.organizationId)));

  revalidatePath('/settings');
  return { success: true };
}

export async function updateMemberRole(memberId: string, role: 'admin' | 'member') {
  const session = await requireAdmin();

  // Prevent demoting yourself if you're the only admin
  if (memberId === session.user.id && role === 'member') {
    const adminCount = await db
      .select()
      .from(user)
      .where(and(eq(user.organizationId, session.user.organizationId), eq(user.role, 'admin')));

    if (adminCount.length <= 1) {
      return { success: false, error: 'Cannot demote: You are the only admin' };
    }
  }

  await db
    .update(user)
    .set({ role, updatedAt: new Date() })
    .where(and(eq(user.id, memberId), eq(user.organizationId, session.user.organizationId)));

  revalidatePath('/settings');
  return { success: true };
}

// === PROFILE ===

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const [userData] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);

  return userData || null;
}

export async function updateUserProfile(data: { name: string; image?: string }) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db
    .update(user)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(user.id, session.user.id));

  revalidatePath('/settings');
  return { success: true };
}

// === INVITATION ACCEPTANCE ===

export async function getInvitationByToken(token: string) {
  const [invitation] = await db
    .select()
    .from(teamInvitations)
    .where(and(eq(teamInvitations.token, token), eq(teamInvitations.status, 'pending')))
    .limit(1);

  if (!invitation) return null;

  if (new Date(invitation.expiresAt) < new Date()) {
    // Mark as expired
    await db
      .update(teamInvitations)
      .set({ status: 'expired' })
      .where(eq(teamInvitations.id, invitation.id));
    return null;
  }

  // Get organization and inviter details in parallel
  const [[org], [inviter]] = await Promise.all([
    db
      .select({ name: organizations.name, logoUrl: organizations.logoUrl })
      .from(organizations)
      .where(eq(organizations.id, invitation.organizationId))
      .limit(1),
    db
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, invitation.invitedBy))
      .limit(1),
  ]);

  return {
    ...invitation,
    organization: org || null,
    inviter: inviter || null,
  };
}

export async function acceptInvitation(token: string, userId: string) {
  const invitation = await getInvitationByToken(token);
  if (!invitation) {
    return { success: false, error: 'Invalid or expired invitation' };
  }

  // Update user to join organization
  await db
    .update(user)
    .set({
      organizationId: invitation.organizationId,
      role: invitation.role,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));

  // Mark invitation as accepted
  await db
    .update(teamInvitations)
    .set({ status: 'accepted', acceptedAt: new Date() })
    .where(eq(teamInvitations.id, invitation.id));

  return { success: true };
}

// === UTILITY: Check Admin Status ===

export async function checkIsAdmin() {
  const session = await getSession();
  if (!session?.user?.id) return false;

  const [userData] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  return userData?.role === 'admin';
}
