import { z } from 'zod';
import { extraLibrary } from '@repo/db/schema';
import { eq, or } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../init';

// Per-organization catalog of optional-extra names shown on the pricing page.
// Global rows (seeded defaults) plus the org's own custom entries. The catalog
// is tiny, so the client fetches it whole once and filters locally rather than
// hitting the DB per keystroke.
export const extrasRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({ id: extraLibrary.id, name: extraLibrary.name })
      .from(extraLibrary)
      .where(or(eq(extraLibrary.isGlobal, true), eq(extraLibrary.organizationId, ctx.orgId)))
      .orderBy(extraLibrary.name);
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
