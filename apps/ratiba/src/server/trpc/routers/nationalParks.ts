import { z } from 'zod';
import { nationalParks } from '@repo/db/schema';
import { and, eq, ilike, isNull } from 'drizzle-orm';
import { router, publicProcedure, protectedProcedure, escapeLikeQuery } from '../init';
import { log } from '@/lib/logger';

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
      const cols = {
        id: nationalParks.id,
        name: nationalParks.name,
        country: nationalParks.country,
        latitude: nationalParks.latitude,
        longitude: nationalParks.longitude,
      };

      const catalogOnly = isNull(nationalParks.overview_page_id);

      if (!trimmed) {
        return ctx.db.select(cols).from(nationalParks).where(catalogOnly).limit(input.limit);
      }

      return ctx.db
        .select(cols)
        .from(nationalParks)
        .where(and(ilike(nationalParks.name, `%${escapeLikeQuery(trimmed)}%`), catalogOnly))
        .limit(input.limit);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return (
        (await ctx.db.query.nationalParks.findFirst({
          where: eq(nationalParks.id, input.id),
          columns: { id: true, name: true, latitude: true, longitude: true },
        })) ?? null
      );
    }),

  // Adds a destination typed by an operator that isn't in the curated catalog.
  // Coordinates come from client-side geocoding so the map pin works immediately;
  // the row is flagged source='user' so it can be reviewed and image-seeded later.
  createCustom: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(2).max(120),
        latitude: z.number().finite().optional(),
        longitude: z.number().finite().optional(),
        country: z.string().trim().max(120).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const name = input.name.trim();

      // Dedupe: if a park with this exact name already exists (case-insensitive),
      // reuse it instead of creating a near-duplicate catalog entry.
      const existing = await ctx.db.query.nationalParks.findFirst({
        where: ilike(nationalParks.name, escapeLikeQuery(name)),
        columns: { id: true, name: true },
      });
      if (existing) return { id: existing.id, name: existing.name };

      const [created] = await ctx.db
        .insert(nationalParks)
        .values({
          name,
          country: input.country?.trim() || '',
          latitude: input.latitude != null ? String(input.latitude) : null,
          longitude: input.longitude != null ? String(input.longitude) : null,
          source: 'user',
          created_by: ctx.user.id,
          updatedAt: new Date().toISOString(),
        })
        .returning({ id: nationalParks.id, name: nationalParks.name });

      // Notify the team so a real image set can be seeded for this destination.
      // Non-blocking: never fail the user's action on an email hiccup.
      try {
        const { sendNewDestinationEmail } = await import('@repo/resend');
        await sendNewDestinationEmail({
          destinationName: created!.name,
          addedByName: ctx.user.name ?? null,
          addedByEmail: ctx.user.email ?? null,
          organizationId: ctx.orgId,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
        });
      } catch (error) {
        log.error('Failed to send new-destination notification', {
          destinationName: created!.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      return { id: created!.id, name: created!.name };
    }),
});
