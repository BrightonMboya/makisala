import { z } from 'zod';
import { accommodationImages, accommodations } from '@repo/db/schema';
import { and, desc, eq, ilike, inArray, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure, escapeLikeQuery } from '../init';
import { getPublicUrl, uploadToStorage } from '@/lib/storage';
import { compressImage, replaceExtension } from '@/lib/image-utils';


const imageSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.string().min(1).max(100),
  base64: z.string().min(1).max(14 * 1024 * 1024), // ~10MB binary
});

export const accommodationsRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          query: z.string().optional(),
          page: z.number().int().positive().default(1),
          limit: z.number().int().positive().max(100).default(10),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 10;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (input?.query) {
        conditions.push(ilike(accommodations.name, `%${escapeLikeQuery(input.query)}%`));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [data, total] = await Promise.all([
        ctx.db
          .select()
          .from(accommodations)
          .where(whereClause)
          .limit(limit)
          .offset(offset)
          .orderBy(desc(accommodations.name)),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(accommodations)
          .where(whereClause)
          .then((res) => Number(res[0]?.count || 0)),
      ]);

      const accIds = data.map((acc) => acc.id);
      const images =
        accIds.length > 0
          ? await ctx.db
              .select()
              .from(accommodationImages)
              .where(inArray(accommodationImages.accommodationId, accIds))
          : [];

      const accommodationsWithImages = data.map((acc) => ({
        ...acc,
        images: images.filter((img) => img.accommodationId === acc.id),
      }));

      return {
        accommodations: accommodationsWithImages,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [acc] = await ctx.db
        .select()
        .from(accommodations)
        .where(eq(accommodations.id, input.id))
        .limit(1);

      if (!acc) return null;

      const images = await ctx.db
        .select()
        .from(accommodationImages)
        .where(eq(accommodationImages.accommodationId, input.id));

      return { ...acc, images };
    }),

  // Lightweight lookup for itinerary builder (first image only)
  getLookup: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return (
        (await ctx.db.query.accommodations.findFirst({
          where: eq(accommodations.id, input.id),
          with: { images: { limit: 1 } },
        })) ?? null
      );
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
        return ctx.db.query.accommodations.findMany({
          limit: input.limit,
          with: { images: { limit: 1 } },
        });
      }
      return ctx.db.query.accommodations.findMany({
        where: ilike(accommodations.name, `%${escapeLikeQuery(trimmed)}%`),
        limit: input.limit,
        with: { images: { limit: 1 } },
      });
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const results = await ctx.db.query.accommodations.findMany({
      with: { images: true },
    });

    return results.map((acc) => ({
      ...acc,
      images: acc.images.map((img) => ({
        ...img,
        url: getPublicUrl(img.bucket, img.key),
      })),
    }));
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        url: z.string().url().optional().or(z.literal('')),
        overview: z.string().max(1000).optional(),
        description: z.string().max(5000).optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        images: z.array(imageSchema).max(20).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [newAcc] = await ctx.db
        .insert(accommodations)
        .values({
          name: input.name,
          url: input.url || undefined,
          overview: input.overview,
          description: input.description,
          latitude: input.latitude,
          longitude: input.longitude,
        })
        .returning();

      if (!newAcc) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create accommodation',
        });
      }

      if (input.images && input.images.length > 0) {
        for (const img of input.images) {
          const rawBuffer = Buffer.from(img.base64, 'base64');
          const compressed = await compressImage(rawBuffer);
          const compressedName = replaceExtension(img.name, compressed.extension);
          const key = `accommodations/${newAcc.id}/${Date.now()}-${compressedName}`;
          const { bucket, key: storageKey } = await uploadToStorage({
            file: compressed.buffer,
            contentType: compressed.contentType,
            key,
            visibility: 'public',
          });

          await ctx.db.insert(accommodationImages).values({
            accommodationId: newAcc.id,
            bucket,
            key: storageKey,
          });
        }
      }

      return { id: newAcc.id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255),
        url: z.string().url().optional().or(z.literal('')),
        overview: z.string().max(1000).optional(),
        description: z.string().max(5000).optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        newImages: z.array(imageSchema).max(20).optional(),
        removedImageIds: z.array(z.string()).max(50).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, newImages, removedImageIds, ...data } = input;

      await ctx.db
        .update(accommodations)
        .set({
          name: data.name,
          url: data.url || undefined,
          overview: data.overview,
          description: data.description,
          latitude: data.latitude,
          longitude: data.longitude,
        })
        .where(eq(accommodations.id, id));

      if (removedImageIds && removedImageIds.length > 0) {
        await ctx.db.delete(accommodationImages).where(
          and(
            eq(accommodationImages.accommodationId, id),
            inArray(accommodationImages.id, removedImageIds),
          ),
        );
      }

      if (newImages && newImages.length > 0) {
        for (const img of newImages) {
          const rawBuffer = Buffer.from(img.base64, 'base64');
          const compressed = await compressImage(rawBuffer);
          const compressedName = replaceExtension(img.name, compressed.extension);
          const key = `accommodations/${id}/${Date.now()}-${compressedName}`;
          const { bucket, key: storageKey } = await uploadToStorage({
            file: compressed.buffer,
            contentType: compressed.contentType,
            key,
            visibility: 'public',
          });

          await ctx.db.insert(accommodationImages).values({
            accommodationId: id,
            bucket,
            key: storageKey,
          });
        }
      }

      return { success: true };
    }),
});
