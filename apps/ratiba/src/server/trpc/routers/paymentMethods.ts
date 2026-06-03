import { z } from 'zod';
import { organizations, paymentMethods } from '@repo/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { sendPaymentDetailsChangeRequestEmail } from '@repo/resend';
import { router, protectedProcedure, adminProcedure } from '../init';

const PAYMENT_METHOD_TYPES = ['bank_transfer', 'pesapal', 'stripe', 'paypal', 'other'] as const;

const upsertInput = z.object({
  type: z.enum(PAYMENT_METHOD_TYPES),
  label: z.string().min(1, 'Label is required').max(255),
  instructions: z.string().max(5000).optional(),
  url: z.string().url('Must be a valid URL').max(2000).optional().or(z.literal('')),
  sortOrder: z.number().int().min(0).optional(),
});

/**
 * Throws if the org's payment details are locked. Locking is a security control:
 * once an admin confirms their payout details, they cannot self-service edits.
 * Unlocking is done out-of-band by the Ratiba team (see requestChange).
 */
async function assertNotLocked(db: typeof import('@repo/db').db, orgId: string) {
  const [org] = await db
    .select({ lockedAt: organizations.paymentDetailsLockedAt })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (org?.lockedAt) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message:
        'Payment details are locked. Request a change to unlock before editing.',
    });
  }
}

export const paymentMethodsRouter = router({
  // Returns the org's payment methods plus the lock state.
  list: protectedProcedure.query(async ({ ctx }) => {
    const [methods, [org]] = await Promise.all([
      ctx.db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.organizationId, ctx.orgId))
        .orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.createdAt)),
      ctx.db
        .select({ lockedAt: organizations.paymentDetailsLockedAt })
        .from(organizations)
        .where(eq(organizations.id, ctx.orgId))
        .limit(1),
    ]);

    return {
      methods,
      lockedAt: org?.lockedAt ?? null,
    };
  }),

  create: adminProcedure.input(upsertInput).mutation(async ({ ctx, input }) => {
    await assertNotLocked(ctx.db, ctx.orgId);

    const [created] = await ctx.db
      .insert(paymentMethods)
      .values({
        organizationId: ctx.orgId,
        type: input.type,
        label: input.label,
        instructions: input.instructions || null,
        url: input.url || null,
        sortOrder: input.sortOrder ?? 0,
      })
      .returning();

    return created;
  }),

  update: adminProcedure
    .input(upsertInput.partial().extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await assertNotLocked(ctx.db, ctx.orgId);

      const { id, url, ...rest } = input;

      const [updated] = await ctx.db
        .update(paymentMethods)
        .set({
          ...rest,
          ...(url !== undefined ? { url: url || null } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(paymentMethods.id, id), eq(paymentMethods.organizationId, ctx.orgId)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Payment method not found' });
      }

      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await assertNotLocked(ctx.db, ctx.orgId);

      await ctx.db
        .delete(paymentMethods)
        .where(and(eq(paymentMethods.id, input.id), eq(paymentMethods.organizationId, ctx.orgId)));

      return { success: true };
    }),

  // Locks the org's payment details. Requires at least one method.
  confirm: adminProcedure.mutation(async ({ ctx }) => {
    const [org] = await ctx.db
      .select({ lockedAt: organizations.paymentDetailsLockedAt })
      .from(organizations)
      .where(eq(organizations.id, ctx.orgId))
      .limit(1);

    if (org?.lockedAt) {
      return { success: true, lockedAt: org.lockedAt };
    }

    const existing = await ctx.db
      .select({ id: paymentMethods.id })
      .from(paymentMethods)
      .where(eq(paymentMethods.organizationId, ctx.orgId))
      .limit(1);

    if (existing.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Add at least one payment method before confirming.',
      });
    }

    const lockedAt = new Date();
    await ctx.db
      .update(organizations)
      .set({ paymentDetailsLockedAt: lockedAt, updatedAt: new Date() })
      .where(eq(organizations.id, ctx.orgId));

    return { success: true, lockedAt };
  }),

  // Emails the Ratiba team to request an unlock. Does NOT unlock automatically.
  requestChange: adminProcedure
    .input(z.object({ reason: z.string().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const [org] = await ctx.db
        .select({ name: organizations.name, lockedAt: organizations.paymentDetailsLockedAt })
        .from(organizations)
        .where(eq(organizations.id, ctx.orgId))
        .limit(1);

      if (!org) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Organization not found' });
      }

      if (!org.lockedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Payment details are not locked.',
        });
      }

      const result = await sendPaymentDetailsChangeRequestEmail({
        organizationName: org.name,
        organizationId: ctx.orgId,
        requesterName: ctx.user.name || 'Unknown',
        requesterEmail: ctx.user.email,
        reason: input.reason,
      });

      if (!result.success) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error });
      }

      return { success: true };
    }),
});
