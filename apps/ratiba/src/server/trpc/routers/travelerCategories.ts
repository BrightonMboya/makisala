import { z } from 'zod';
import { travelerCategoryLibrary } from '@repo/db/schema';
import { eq, or } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../init';

// Per-organization catalog of custom traveler categories (e.g. "Infant",
// "Guide") typed on the fly in the traveler group editors. The built-in
// categories (Adult / Senior / Child / Baby) live in the client; this table
// only stores an org's custom additions so they persist and stay available
// across every itinerary. Global rows (seeded defaults) plus the org's own
// custom entries. The catalog is tiny, so `list` returns it in full rather
// than paging like activities/extras.
export const travelerCategoriesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ id: travelerCategoryLibrary.id, name: travelerCategoryLibrary.name })
      .from(travelerCategoryLibrary)
      .where(
        or(
          eq(travelerCategoryLibrary.isGlobal, true),
          eq(travelerCategoryLibrary.organizationId, ctx.orgId),
        ),
      )
      .orderBy(travelerCategoryLibrary.name);
    return rows;
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const name = input.name.trim();
      if (!name) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Name is required' });

      // Single round trip: insert, or return the existing row if this org already
      // has one with the same name (unique on organization_id + name).
      const [category] = await ctx.db
        .insert(travelerCategoryLibrary)
        .values({ name, organizationId: ctx.orgId, isGlobal: false })
        .onConflictDoUpdate({
          target: [travelerCategoryLibrary.organizationId, travelerCategoryLibrary.name],
          set: { name },
        })
        .returning({ id: travelerCategoryLibrary.id, name: travelerCategoryLibrary.name });

      if (!category) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create traveler category',
        });
      }

      return category;
    }),
});
