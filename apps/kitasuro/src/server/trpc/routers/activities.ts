import { z } from 'zod';
import { activityLibrary } from '@repo/db/schema';
import { and, eq, ilike, or } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../init';

export const activitiesRouter = router({
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().default(''),
        limit: z.number().int().positive().max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = or(
        eq(activityLibrary.isGlobal, true),
        eq(activityLibrary.organizationId, ctx.orgId),
      );

      const trimmed = input.query.trim();

      if (!trimmed) {
        return ctx.db
          .select({ id: activityLibrary.id, name: activityLibrary.name })
          .from(activityLibrary)
          .where(conditions)
          .orderBy(activityLibrary.name)
          .limit(input.limit);
      }

      return ctx.db
        .select({ id: activityLibrary.id, name: activityLibrary.name })
        .from(activityLibrary)
        .where(and(conditions, ilike(activityLibrary.name, `%${trimmed}%`)))
        .orderBy(activityLibrary.name)
        .limit(input.limit);
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [activity] = await ctx.db
        .insert(activityLibrary)
        .values({
          name: input.name,
          organizationId: ctx.orgId,
          isGlobal: false,
        })
        .returning({ id: activityLibrary.id, name: activityLibrary.name });

      if (!activity) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create activity',
        });
      }

      return activity;
    }),
});
