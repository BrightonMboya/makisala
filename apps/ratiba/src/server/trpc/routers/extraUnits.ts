import { z } from 'zod';
import { extraUnitLibrary } from '@repo/db/schema';
import { eq, or } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../init';

// Per-organization catalog of custom pricing units for optional extras (e.g.
// "per night", "per vehicle") typed on the fly on the pricing page. The built-in
// units (per person / per group / free) live in the client; this table only
// stores an org's custom additions so they persist and stay available across
// every itinerary. Global rows (seeded defaults) plus the org's own custom
// entries. The catalog is tiny, so `list` returns it in full rather than paging.
export const extraUnitsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ id: extraUnitLibrary.id, name: extraUnitLibrary.name })
      .from(extraUnitLibrary)
      .where(or(eq(extraUnitLibrary.isGlobal, true), eq(extraUnitLibrary.organizationId, ctx.orgId)))
      .orderBy(extraUnitLibrary.name);
    return rows;
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const name = input.name.trim();
      if (!name) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Name is required' });

      // Single round trip: insert, or return the existing row if this org already
      // has one with the same name (unique on organization_id + name).
      const [unit] = await ctx.db
        .insert(extraUnitLibrary)
        .values({ name, organizationId: ctx.orgId, isGlobal: false })
        .onConflictDoUpdate({
          target: [extraUnitLibrary.organizationId, extraUnitLibrary.name],
          set: { name },
        })
        .returning({ id: extraUnitLibrary.id, name: extraUnitLibrary.name });

      if (!unit) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create pricing unit',
        });
      }

      return unit;
    }),
});
