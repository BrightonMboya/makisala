import { z } from 'zod';
import { db, organizations, user, member, invitation } from '@repo/db';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { headers } from 'next/headers';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, adminProcedure, publicProcedure } from '../init';
import { auth } from '@/lib/auth';
import { uploadToStorage } from '@/lib/storage';
import { compressImage } from '@/lib/image-utils';
import { checkFeatureAccess } from '@/lib/plans';


export const settingsRouter = router({
  getOrg: protectedProcedure.query(async ({ ctx }) => {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, ctx.orgId))
      .limit(1);
    return org || null;
  }),

  updateOrg: adminProcedure
    .input(
      z.object({
        name: z.string().max(255).optional(),
        logoUrl: z.string().max(500).optional(),
        notificationEmail: z.string().email().max(255).optional(),
        aboutDescription: z.string().max(5000).optional(),
        paymentTerms: z.string().max(10000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .update(organizations)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(organizations.id, ctx.orgId));
      return { success: true };
    }),

  uploadLogo: adminProcedure
    .input(z.object({
      base64Data: z.string().max(7 * 1024 * 1024, 'Image too large. Maximum size is 5MB.'),
    }))
    .mutation(async ({ ctx, input }) => {
      const base64 = input.base64Data.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64, 'base64');

      const compressed = await compressImage(buffer, {
        quality: 85,
        maxWidth: 512,
        maxHeight: 512,
      });

      const key = `organizations/${ctx.orgId}/logo.webp`;

      const result = await uploadToStorage({
        file: compressed.buffer,
        contentType: compressed.contentType,
        key,
        visibility: 'public',
      });

      if (!result.publicUrl) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to upload logo' });
      }

      const logoUrl = `${result.publicUrl}?v=${Date.now()}`;

      await db
        .update(organizations)
        .set({ logoUrl, updatedAt: new Date() })
        .where(eq(organizations.id, ctx.orgId));

      return { success: true, url: logoUrl };
    }),

  getTeam: protectedProcedure.query(async ({ ctx }) => {
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
      .where(eq(member.organizationId, ctx.orgId))
      .orderBy(desc(member.createdAt));

    return members;
  }),

  getPendingInvitations: protectedProcedure.query(async ({ ctx }) => {
    const invitations_list = await db
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
          eq(invitation.organizationId, ctx.orgId),
          eq(invitation.status, 'pending'),
        ),
      )
      .orderBy(desc(invitation.createdAt));

    const inviterIds = invitations_list
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

    return invitations_list.map((inv) => ({
      ...inv,
      inviter: { name: inv.inviterId ? inviterMap.get(inv.inviterId) || 'Unknown' : 'Unknown' },
    }));
  }),

  inviteMember: adminProcedure
    .input(z.object({ email: z.string().email(), role: z.enum(['admin', 'member']) }))
    .mutation(async ({ ctx, input }) => {
      const access = await checkFeatureAccess(ctx.orgId, 'teamMembers');
      if (!access.allowed) {
        throw new TRPCError({ code: 'FORBIDDEN', message: access.reason });
      }

      const hdrs = await headers();
      const result = await auth.api.createInvitation({
        body: {
          email: input.email,
          role: input.role,
          organizationId: ctx.orgId,
        },
        headers: hdrs,
      });

      return { success: true, invitation: result };
    }),

  revokeInvitation: adminProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ input }) => {
      const hdrs = await headers();
      await auth.api.cancelInvitation({
        body: { invitationId: input.invitationId },
        headers: hdrs,
      });
      return { success: true };
    }),

  removeMember: adminProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [memberData] = await db
        .select({ userId: member.userId })
        .from(member)
        .where(eq(member.id, input.memberId))
        .limit(1);

      if (memberData?.userId === ctx.user.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot remove yourself from the team' });
      }

      const hdrs = await headers();
      await auth.api.removeMember({
        body: {
          memberIdOrEmail: input.memberId,
          organizationId: ctx.orgId,
        },
        headers: hdrs,
      });

      return { success: true };
    }),

  updateRole: adminProcedure
    .input(z.object({ memberId: z.string(), role: z.enum(['admin', 'member']) }))
    .mutation(async ({ ctx, input }) => {
      const canProceed = await db.transaction(async (tx) => {
        const [memberData] = await tx
          .select({ userId: member.userId })
          .from(member)
          .where(eq(member.id, input.memberId))
          .limit(1);

        if (memberData?.userId === ctx.user.id && input.role === 'member') {
          const adminCount = await tx
            .select()
            .from(member)
            .where(
              and(
                eq(member.organizationId, ctx.orgId),
                eq(member.role, 'admin'),
              ),
            );

          if (adminCount.length <= 1) {
            return { allowed: false as const, error: 'Cannot demote: You are the only admin' };
          }
        }

        return { allowed: true as const };
      });

      if (!canProceed.allowed) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: canProceed.error });
      }

      const hdrs = await headers();
      await auth.api.updateMemberRole({
        body: {
          memberId: input.memberId,
          role: input.role,
          organizationId: ctx.orgId,
        },
        headers: hdrs,
      });

      return { success: true };
    }),

  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const [userData] = await db.select().from(user).where(eq(user.id, ctx.user.id)).limit(1);
    return userData || null;
  }),

  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().max(255), image: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(user)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(user.id, ctx.user.id));
      return { success: true };
    }),

  uploadAvatar: protectedProcedure
    .input(z.object({
      base64Data: z.string().max(7 * 1024 * 1024, 'Image too large. Maximum size is 5MB.'),
    }))
    .mutation(async ({ ctx, input }) => {
      const base64 = input.base64Data.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64, 'base64');

      const compressed = await compressImage(buffer, {
        quality: 85,
        maxWidth: 256,
        maxHeight: 256,
      });

      const key = `organizations/${ctx.orgId}/user-profiles/${ctx.user.id}-avatar.webp`;

      const result = await uploadToStorage({
        file: compressed.buffer,
        contentType: compressed.contentType,
        key,
        visibility: 'public',
      });

      if (!result.publicUrl) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to upload avatar' });
      }

      const imageUrl = `${result.publicUrl}?v=${Date.now()}`;

      await db
        .update(user)
        .set({ image: imageUrl, updatedAt: new Date() })
        .where(eq(user.id, ctx.user.id));

      return { success: true, url: imageUrl };
    }),

  checkAdmin: protectedProcedure.query(async ({ ctx }) => {
    const [membership] = await db
      .select({ role: member.role })
      .from(member)
      .where(
        and(
          eq(member.userId, ctx.user.id),
          eq(member.organizationId, ctx.orgId),
        ),
      )
      .limit(1);

    return membership?.role === 'admin';
  }),

  // Invitation acceptance flows (public - no auth required)
  getInvitationStatus: publicProcedure
    .input(z.object({ invitationId: z.string() }))
    .query(async ({ input }) => {
      const [inv] = await db
        .select({ status: invitation.status })
        .from(invitation)
        .where(eq(invitation.id, input.invitationId))
        .limit(1);
      return inv?.status || null;
    }),

  getInvitationByToken: publicProcedure
    .input(z.object({ invitationId: z.string() }))
    .query(async ({ input }) => {
      const [inv] = await db
        .select()
        .from(invitation)
        .where(and(eq(invitation.id, input.invitationId), eq(invitation.status, 'pending')))
        .limit(1);

      if (!inv) return null;

      if (new Date(inv.expiresAt) < new Date()) {
        await db
          .update(invitation)
          .set({ status: 'expired' })
          .where(eq(invitation.id, inv.id));
        return null;
      }

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
    }),

  acceptInvitation: publicProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ input }) => {
      const hdrs = await headers();

      const [inv] = await db
        .select({ organizationId: invitation.organizationId })
        .from(invitation)
        .where(eq(invitation.id, input.invitationId))
        .limit(1);

      if (!inv) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invitation not found' });
      }

      await auth.api.acceptInvitation({
        body: { invitationId: input.invitationId },
        headers: hdrs,
      });

      await auth.api.setActiveOrganization({
        body: { organizationId: inv.organizationId },
        headers: hdrs,
      });

      return { success: true };
    }),
});
