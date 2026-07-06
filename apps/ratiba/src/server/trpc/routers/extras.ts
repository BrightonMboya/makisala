import { z } from 'zod';
import { extraLibrary } from '@repo/db/schema';
import { and, eq, ilike, or } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, escapeLikeQuery } from '../init';

// Per-organization catalog of optional-extra names shown on the pricing page.
// Global rows (seeded defaults) plus the org's own custom entries. Searched
// server-side with a limit so a large catalog never ships in full to the
// client — mirrors the activities router.
export const extrasRouter = router({
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().default(''),
        limit: z.number().int().positive().max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = or(
        eq(extraLibrary.isGlobal, true),
        eq(extraLibrary.organizationId, ctx.orgId),
      );

      const trimmed = input.query.trim();

      if (!trimmed) {
        return ctx.db
          .select({ id: extraLibrary.id, name: extraLibrary.name })
          .from(extraLibrary)
          .where(conditions)
          .orderBy(extraLibrary.name)
          .limit(input.limit);
      }

      return ctx.db
        .select({ id: extraLibrary.id, name: extraLibrary.name })
        .from(extraLibrary)
        .where(and(conditions, ilike(extraLibrary.name, `%${escapeLikeQuery(trimmed)}%`)))
        .orderBy(extraLibrary.name)
        .limit(input.limit);
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const name = input.name.trim();
      if (!name) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Name is required' });

      // Single round trip: insert, or return the existing row if this org already
      // has one with the same name (unique on organization_id + name).
      const [extra] = await ctx.db
        .insert(extraLibrary)
        .values({ name, organizationId: ctx.orgId, isGlobal: false })
        .onConflictDoUpdate({
          target: [extraLibrary.organizationId, extraLibrary.name],
          set: { name },
        })
        .returning({ id: extraLibrary.id, name: extraLibrary.name });

      if (!extra) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create extra',
        });
      }

      return extra;
    }),
});
