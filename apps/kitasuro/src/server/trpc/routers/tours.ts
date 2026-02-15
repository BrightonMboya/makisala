import { z } from 'zod';
import { db } from '@repo/db';
import {
  tours,
  itineraryDays,
  itineraryAccommodations,
  pages,
} from '@repo/db/schema';
import { eq, inArray, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, publicProcedure } from '../init';

export const toursRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select({
        id: tours.id,
        name: tours.tourName,
        days: tours.number_of_days,
        imageUrl: tours.img_url,
        overview: tours.overview,
        country: tours.country,
        pricing: tours.pricing,
        tags: tours.tags,
      })
      .from(tours)
      .where(eq(tours.organizationId, ctx.orgId))
      .orderBy(tours.tourName);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tour = await db.query.tours.findFirst({
        where: eq(tours.id, input.id),
        with: {
          days: {
            with: {
              itineraryAccommodations: {
                with: {
                  accommodation: {
                    with: {
                      images: { limit: 1 },
                    },
                  },
                },
              },
            },
            orderBy: (days, { asc }) => [asc(days.dayNumber)],
          },
        },
      });

      if (!tour || tour.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tour not found' });
      }

      return tour;
    }),

  getDetails: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const tour = await db.query.tours.findFirst({
        where: eq(tours.id, input.id),
        with: {
          days: {
            with: {
              itineraryAccommodations: {
                with: { accommodation: true },
              },
            },
            orderBy: (days, { asc }) => [asc(days.dayNumber)],
          },
        },
      });

      if (!tour) return null;

      return {
        tourType: 'Private Tour',
        price: tour.pricing,
        country: tour.country,
        days: tour.days.map((day) => ({
          id: day.id,
          dayNumber: day.dayNumber,
          date: undefined,
          destination: day.national_park_id || null,
          accommodation: day.itineraryAccommodations?.[0]?.accommodation?.id || null,
          activities: [],
          meals: { breakfast: true, lunch: true, dinner: true },
        })),
        selectedTheme: 'minimalistic',
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        tourName: z.string().optional(),
        overview: z.string().optional(),
        pricing: z.string().optional(),
        country: z.string().optional(),
        tags: z.array(z.string().max(100)).max(20).optional(),
        img_url: z.string().optional(),
        number_of_days: z.number().optional(),
        itineraries: z
          .array(
            z.object({
              dayNumber: z.number(),
              title: z.string().max(255),
              overview: z.string().max(5000).optional(),
              national_park_id: z.string().optional(),
              accommodation_id: z.string().optional(),
            }),
          )
          .max(60)
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tour = await db.query.tours.findFirst({
        where: eq(tours.id, input.id),
        columns: { organizationId: true },
      });

      if (!tour || tour.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tour not found or unauthorized' });
      }

      const { id, itineraries, ...tourData } = input;

      if (itineraries && itineraries.length > 0) {
        const dayNumbers = itineraries.map((d) => d.dayNumber);
        const uniqueDayNumbers = new Set(dayNumbers);

        if (uniqueDayNumbers.size !== dayNumbers.length) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Duplicate day numbers are not allowed' });
        }

        if (dayNumbers.some((n) => !Number.isInteger(n) || n < 1)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Day numbers must be positive integers' });
        }

        const sortedDayNumbers = [...dayNumbers].sort((a, b) => a - b);
        const isSequential = sortedDayNumbers.every((num, idx) => num === idx + 1);
        if (!isSequential) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Day numbers must be sequential starting from 1' });
        }
      }

      await db.transaction(async (tx) => {
        await tx
          .update(tours)
          .set({ ...tourData, updatedAt: new Date() })
          .where(eq(tours.id, id));

        if (itineraries && itineraries.length > 0) {
          await tx.delete(itineraryDays).where(eq(itineraryDays.tourId, id));

          for (const day of itineraries) {
            const [newDay] = await tx
              .insert(itineraryDays)
              .values({
                tourId: id,
                dayNumber: day.dayNumber,
                dayTitle: day.title,
                overview: day.overview || null,
                national_park_id: day.national_park_id || null,
              })
              .returning({ id: itineraryDays.id });

            if (day.accommodation_id && newDay) {
              await tx.insert(itineraryAccommodations).values({
                itineraryDayId: newDay.id,
                accommodationId: day.accommodation_id,
              });
            }
          }
        }
      });

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tour = await db.query.tours.findFirst({
        where: eq(tours.id, input.id),
        columns: { organizationId: true },
      });

      if (!tour || tour.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tour not found or unauthorized' });
      }

      await db.delete(tours).where(eq(tours.id, input.id));
      return { success: true };
    }),

  getToursAndClients: protectedProcedure.query(async ({ ctx }) => {
    const { clients } = await import('@repo/db/schema');

    const [toursData, clientsData] = await Promise.all([
      db
        .select({
          id: tours.id,
          name: tours.tourName,
          days: tours.number_of_days,
        })
        .from(tours)
        .where(eq(tours.organizationId, ctx.orgId))
        .orderBy(tours.tourName),
      db
        .select({ id: clients.id, name: clients.name })
        .from(clients)
        .where(eq(clients.organizationId, ctx.orgId))
        .orderBy(clients.name),
    ]);

    return { tours: toursData, clients: clientsData };
  }),

  getSharedTemplates: publicProcedure.query(async () => {
    return await db
      .select({
        id: tours.id,
        name: tours.tourName,
        overview: tours.overview,
        days: tours.number_of_days,
        country: tours.country,
        imageUrl: tours.img_url,
        tags: tours.tags,
      })
      .from(tours)
      .where(isNull(tours.organizationId))
      .orderBy(tours.tourName)
      .limit(100);
  }),

  cloneTemplate: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const template = await db.query.tours.findFirst({
        where: eq(tours.id, input.templateId),
        with: {
          days: {
            with: { itineraryAccommodations: true },
          },
        },
      });

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
      }

      if (template.organizationId !== null && template.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized to clone this template' });
      }

      const result = await db.transaction(async (tx) => {
        const newTourResult = await tx
          .insert(tours)
          .values({
            tourName: template.tourName,
            slug: template.slug,
            overview: template.overview,
            pricing: template.pricing,
            country: template.country,
            sourceUrl: template.sourceUrl,
            activities: template.activities,
            topFeatures: template.topFeatures,
            img_url: template.img_url,
            number_of_days: template.number_of_days,
            tags: template.tags,
            organizationId: ctx.orgId,
            clonedFromId: template.id,
          })
          .returning({ id: tours.id });

        const newTour = newTourResult[0];
        if (!newTour) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create tour' });

        if (template.days && template.days.length > 0) {
          for (const day of template.days) {
            const newDayResult = await tx
              .insert(itineraryDays)
              .values({
                tourId: newTour.id,
                dayNumber: day.dayNumber,
                dayTitle: day.dayTitle,
                overview: day.overview,
                national_park_id: day.national_park_id,
              })
              .returning({ id: itineraryDays.id });

            const newDay = newDayResult[0];
            if (!newDay) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create itinerary day' });

            if (day.itineraryAccommodations && day.itineraryAccommodations.length > 0) {
              await tx.insert(itineraryAccommodations).values(
                day.itineraryAccommodations.map((acc) => ({
                  itineraryDayId: newDay.id,
                  accommodationId: acc.accommodationId,
                })),
              );
            }
          }
        }

        return { tourId: newTour.id };
      });

      return { success: true, tourId: result.tourId };
    }),

  getRandomDayTemplate: publicProcedure
    .input(
      z.object({
        nationalParkId: z.string(),
        dayType: z.enum(['arrival', 'full_day', 'half_day', 'departure']).optional(),
        excludeDescriptions: z.array(z.string()).max(100).optional(),
      }),
    )
    .query(async ({ input }) => {
      const { dayContentTemplates } = await import('@repo/db/schema');

      const templates = await db
        .select({
          id: dayContentTemplates.id,
          dayType: dayContentTemplates.dayType,
          description: dayContentTemplates.description,
        })
        .from(dayContentTemplates)
        .where(eq(dayContentTemplates.nationalParkId, input.nationalParkId));

      if (templates.length === 0) return null;

      let candidates = templates;
      if (input.dayType) {
        const typeMatches = candidates.filter((t) => t.dayType === input.dayType);
        if (typeMatches.length > 0) candidates = typeMatches;
      }

      if (input.excludeDescriptions && input.excludeDescriptions.length > 0) {
        const filtered = candidates.filter((t) => !input.excludeDescriptions!.includes(t.description));
        if (filtered.length > 0) candidates = filtered;
      }

      const randomIndex = Math.floor(Math.random() * candidates.length);
      return candidates[randomIndex] ?? null;
    }),

  getPageImages: publicProcedure
    .input(z.object({ pageIds: z.array(z.string()).max(100) }))
    .query(async ({ input }) => {
      if (input.pageIds.length === 0) return [];

      return await db
        .select({ id: pages.id, featured_image_url: pages.featured_image_url })
        .from(pages)
        .where(inArray(pages.id, input.pageIds));
    }),
});
