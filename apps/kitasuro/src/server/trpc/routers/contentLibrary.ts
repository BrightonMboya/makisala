import { z } from 'zod';
import { accommodations, organizationImages } from '@repo/db/schema';
import { and, asc, desc, eq, ilike, lt, or, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../init';
import { deleteFromStorage, getPublicUrl, uploadToStorage } from '@/lib/storage';
import { compressImage, replaceExtension } from '@/lib/image-utils';
import { checkFeatureAccess } from '@/lib/plans';


const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

function encodeCursor(id: string, createdAt: Date): string {
  return Buffer.from(`${id}:${createdAt.toISOString()}`).toString('base64url');
}

function decodeCursor(cursor: string): { id: string; createdAt: Date } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString();
    const sepIndex = decoded.indexOf(':');
    if (sepIndex === -1) return null;
    const id = decoded.slice(0, sepIndex);
    const createdAt = new Date(decoded.slice(sepIndex + 1));
    if (isNaN(createdAt.getTime())) return null;
    return { id, createdAt };
  } catch {
    return null;
  }
}

export const contentLibraryRouter = router({
  getAccommodationsWithStatus: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().positive().default(1),
          limit: z.number().int().positive().max(100).default(20),
          query: z.string().default(''),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const query = input?.query ?? '';
      const offset = (page - 1) * limit;

      const filters = query ? ilike(accommodations.name, `%${query}%`) : undefined;

      const [data, total] = await Promise.all([
        ctx.db.query.accommodations.findMany({
          columns: { id: true, name: true, url: true },
          with: { images: { columns: { bucket: true, key: true }, limit: 1 } },
          where: filters,
          limit,
          offset,
          orderBy: asc(accommodations.name),
        }),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(accommodations)
          .where(filters)
          .then((res) => Number(res[0]?.count || 0)),
      ]);

      return {
        accommodations: data.map((row) => {
          const img = row.images[0];
          return {
            id: row.id,
            name: row.name,
            url: row.url,
            imageUrl: img ? getPublicUrl(img.bucket, img.key) : null,
          };
        }),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }),

  getOrgImages: protectedProcedure
    .input(
      z
        .object({
          cursor: z.string().optional(),
          limit: z.number().int().positive().max(100).default(20),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const cursor = input?.cursor ? decodeCursor(input.cursor) : null;

      const conditions = [eq(organizationImages.organizationId, ctx.orgId)];

      if (cursor) {
        conditions.push(
          or(
            lt(organizationImages.createdAt, cursor.createdAt),
            and(
              eq(organizationImages.createdAt, cursor.createdAt),
              lt(organizationImages.id, cursor.id),
            ),
          )!,
        );
      }

      const images = await ctx.db
        .select({
          id: organizationImages.id,
          name: organizationImages.name,
          key: organizationImages.key,
          createdAt: organizationImages.createdAt,
        })
        .from(organizationImages)
        .where(and(...conditions))
        .orderBy(desc(organizationImages.createdAt), desc(organizationImages.id))
        .limit(limit + 1);

      const hasMore = images.length > limit;
      const page = hasMore ? images.slice(0, limit) : images;
      const lastItem = page[page.length - 1];
      const nextCursor =
        hasMore && lastItem ? encodeCursor(lastItem.id, lastItem.createdAt) : null;

      return {
        images: page.map((img) => ({
          ...img,
          url: getPublicUrl('', img.key),
        })),
        nextCursor,
      };
    }),

  uploadImage: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        type: z.enum(ALLOWED_IMAGE_TYPES),
        base64: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const access = await checkFeatureAccess(ctx.orgId, 'uploadImages');
      if (!access.allowed) {
        throw new TRPCError({ code: 'FORBIDDEN', message: access.reason });
      }

      const rawBuffer = Buffer.from(input.base64, 'base64');

      if (rawBuffer.length > MAX_FILE_SIZE) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'File size exceeds 10MB limit' });
      }

      const compressed = await compressImage(rawBuffer);
      const compressedName = replaceExtension(input.name, compressed.extension);
      const key = `organizations/${ctx.orgId}/images/${Date.now()}-${compressedName}`;

      await uploadToStorage({
        file: compressed.buffer,
        contentType: compressed.contentType,
        key,
        visibility: 'public',
      });

      const [newImage] = await ctx.db
        .insert(organizationImages)
        .values({
          organizationId: ctx.orgId,
          name: compressedName,
          key,
        })
        .returning();

      if (!newImage) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create image record',
        });
      }

      return {
        id: newImage.id,
        name: newImage.name,
        url: getPublicUrl('', newImage.key),
      };
    }),

  deleteImage: protectedProcedure
    .input(z.object({ imageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [image] = await ctx.db
        .select({ id: organizationImages.id, key: organizationImages.key })
        .from(organizationImages)
        .where(
          and(
            eq(organizationImages.id, input.imageId),
            eq(organizationImages.organizationId, ctx.orgId),
          ),
        )
        .limit(1);

      if (!image) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Image not found' });
      }

      try {
        await deleteFromStorage(image.key);
      } catch (error) {
        console.error('Failed to delete from R2:', error);
      }

      await ctx.db.delete(organizationImages).where(eq(organizationImages.id, input.imageId));

      return { success: true };
    }),
});
