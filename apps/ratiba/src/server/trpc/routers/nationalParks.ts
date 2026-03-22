import { z } from 'zod';
import { nationalParks } from '@repo/db/schema';
import { eq, ilike } from 'drizzle-orm';
import { router, publicProcedure, escapeLikeQuery } from '../init';

export const nationalParksRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: nationalParks.id,
        name: nationalParks.name,
        overview_page_id: nationalParks.overview_page_id,
        latitude: nationalParks.latitude,
        longitude: nationalParks.longitude,
        park_overview: nationalParks.park_overview,
      })
      .from(nationalParks);
  }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string().default(''),
        limit: z.number().int().positive().max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const trimmed = input.query.trim();

      if (!trimmed) {
        return ctx.db
          .select({ id: nationalParks.id, name: nationalParks.name })
          .from(nationalParks)
          .limit(input.limit);
      }

      return ctx.db
        .select({ id: nationalParks.id, name: nationalParks.name })
        .from(nationalParks)
        .where(ilike(nationalParks.name, `%${escapeLikeQuery(trimmed)}%`))
        .limit(input.limit);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return (
        (await ctx.db.query.nationalParks.findFirst({
          where: eq(nationalParks.id, input.id),
          columns: { id: true, name: true },
        })) ?? null
      );
    }),
});
