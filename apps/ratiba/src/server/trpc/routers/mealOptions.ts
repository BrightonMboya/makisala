import { z } from 'zod';
import { mealOptionLibrary } from '@repo/db/schema';
import { and, eq, ilike, or } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, escapeLikeQuery } from '../init';

export const mealOptionsRouter = router({
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().default(''),
        limit: z.number().int().positive().max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = or(
        eq(mealOptionLibrary.isGlobal, true),
        eq(mealOptionLibrary.organizationId, ctx.orgId),
      );

      const trimmed = input.query.trim();

      if (!trimmed) {
        return ctx.db
          .select({
            id: mealOptionLibrary.id,
            name: mealOptionLibrary.name,
            isGlobal: mealOptionLibrary.isGlobal,
          })
          .from(mealOptionLibrary)
          .where(conditions)
          .orderBy(mealOptionLibrary.name)
          .limit(input.limit);
      }

      return ctx.db
        .select({
          id: mealOptionLibrary.id,
          name: mealOptionLibrary.name,
          isGlobal: mealOptionLibrary.isGlobal,
        })
        .from(mealOptionLibrary)
        .where(and(conditions, ilike(mealOptionLibrary.name, `%${escapeLikeQuery(trimmed)}%`)))
        .orderBy(mealOptionLibrary.name)
        .limit(input.limit);
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const name = input.name.trim();
      if (!name) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Name is required' });

      const [option] = await ctx.db
        .insert(mealOptionLibrary)
        .values({ name, organizationId: ctx.orgId, isGlobal: false })
        .onConflictDoUpdate({
          target: [mealOptionLibrary.organizationId, mealOptionLibrary.name],
          set: { name },
        })
        .returning({ id: mealOptionLibrary.id, name: mealOptionLibrary.name });

      if (!option) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create meal option',
        });
      }

      return option;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(mealOptionLibrary)
        .where(
          and(
            eq(mealOptionLibrary.id, input.id),
            eq(mealOptionLibrary.organizationId, ctx.orgId),
            eq(mealOptionLibrary.isGlobal, false),
          ),
        )
        .returning({ id: mealOptionLibrary.id });

      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Option not found or not editable',
        });
      }

      return { id: input.id };
    }),
});
