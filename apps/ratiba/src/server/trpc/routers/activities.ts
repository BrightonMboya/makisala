import { z } from 'zod';
import { activityLibrary, activityRates } from '@repo/db/schema';
import { and, eq, ilike, or } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, adminProcedure, escapeLikeQuery } from '../init';

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
        .where(and(conditions, ilike(activityLibrary.name, `%${escapeLikeQuery(trimmed)}%`)))
        .orderBy(activityLibrary.name)
        .limit(input.limit);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({
          id: activityLibrary.id,
          name: activityLibrary.name,
          locationName: activityLibrary.locationName,
          latitude: activityLibrary.latitude,
          longitude: activityLibrary.longitude,
        })
        .from(activityLibrary)
        .where(
          and(
            eq(activityLibrary.id, input.id),
            or(
              eq(activityLibrary.isGlobal, true),
              eq(activityLibrary.organizationId, ctx.orgId),
            ),
          ),
        )
        .limit(1);
      return row ?? null;
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(255) }))
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

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        locationName: z.string().max(500).nullable().optional(),
        latitude: z.number().nullable().optional(),
        longitude: z.number().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, latitude, longitude, ...rest } = input;
      const patch: Record<string, unknown> = { ...rest };
      if (latitude !== undefined) patch.latitude = latitude === null ? null : String(latitude);
      if (longitude !== undefined) patch.longitude = longitude === null ? null : String(longitude);

      const [existing] = await ctx.db
        .select()
        .from(activityLibrary)
        .where(eq(activityLibrary.id, id))
        .limit(1);
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });

      if (existing.organizationId === ctx.orgId) {
        const [row] = await ctx.db
          .update(activityLibrary)
          .set(patch)
          .where(
            and(eq(activityLibrary.id, id), eq(activityLibrary.organizationId, ctx.orgId)),
          )
          .returning();
        if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
        return row;
      }

      if (!existing.isGlobal) throw new TRPCError({ code: 'FORBIDDEN' });

      const [clone] = await ctx.db
        .insert(activityLibrary)
        .values({
          name: (patch.name as string | undefined) ?? existing.name,
          description: existing.description,
          imageUrl: existing.imageUrl,
          organizationId: ctx.orgId,
          isGlobal: false,
          locationName:
            'locationName' in patch
              ? (patch.locationName as string | null)
              : existing.locationName,
          latitude:
            'latitude' in patch ? (patch.latitude as string | null) : existing.latitude,
          longitude:
            'longitude' in patch ? (patch.longitude as string | null) : existing.longitude,
        })
        .returning();
      if (!clone) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      await ctx.db
        .update(activityRates)
        .set({ activityId: clone.id, updatedAt: new Date() })
        .where(
          and(
            eq(activityRates.organizationId, ctx.orgId),
            eq(activityRates.activityId, id),
          ),
        );

      return clone;
    }),
});
