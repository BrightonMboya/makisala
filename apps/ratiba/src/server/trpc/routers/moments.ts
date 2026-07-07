import { z } from 'zod';
import { momentLibrary } from '@repo/db/schema';
import { eq, or } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../init';

// Per-organization catalog of custom itinerary moments (e.g. "Before Lunch",
// "Sundowner") shown in the activity builder alongside the canonical set. Global
// rows (seeded defaults) plus the org's own custom entries. The catalog is tiny,
// so `list` returns it in full rather than paging like activities/extras.
export const momentsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ id: momentLibrary.id, name: momentLibrary.name })
      .from(momentLibrary)
      .where(or(eq(momentLibrary.isGlobal, true), eq(momentLibrary.organizationId, ctx.orgId)))
      .orderBy(momentLibrary.name);
    return rows;
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const name = input.name.trim();
      if (!name) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Name is required' });

      // Single round trip: insert, or return the existing row if this org already
      // has one with the same name (unique on organization_id + name).
      const [moment] = await ctx.db
        .insert(momentLibrary)
        .values({ name, organizationId: ctx.orgId, isGlobal: false })
        .onConflictDoUpdate({
          target: [momentLibrary.organizationId, momentLibrary.name],
          set: { name },
        })
        .returning({ id: momentLibrary.id, name: momentLibrary.name });

      if (!moment) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create moment',
        });
      }

      return moment;
    }),
});
