import { z } from 'zod';
import { accommodationImages, accommodations, hiddenAccommodationImages } from '@repo/db/schema';
import { and, desc, eq, ilike, inArray, isNull, notInArray, or, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import {
  router,
  publicProcedure,
  protectedProcedure,
  escapeLikeQuery,
  resolveOptionalOrgId,
} from '../init';
import { getHiddenImageIds } from '../lib/hidden-images';
import {
  ALLOWED_UPLOAD_CONTENT_TYPES,
  deleteFromStorage,
  getPublicUrl,
  getSignedUploadUrl,
} from '@/lib/storage';

const uploadedImageSchema = z.object({
  key: z.string().min(1),
  bucket: z.string().min(1),
});

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB per image

/** Keep filenames R2-key-safe while preserving the extension. */
function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
  return cleaned.slice(-100) || 'image';
}

/**
 * SQL predicate for accommodation records a viewer may see: curated/global
 * lodges (organizationId IS NULL) plus, when logged in, that org's own private
 * lodges. Without a session (public/crawler), only global lodges are visible.
 */
function accVisibleWhere(orgId: string | null) {
  return (orgId
    ? or(isNull(accommodations.organizationId), eq(accommodations.organizationId, orgId))
    : isNull(accommodations.organizationId))!;
}

/**
 * Guard write paths: refuse to touch a lodge the org can't see (another org's
 * private lodge). Global and own lodges pass; anything else 404s.
 */
async function assertAccommodationVisible(
  ctx: { db: { select: (...args: any[]) => any }; orgId: string },
  accommodationId: string,
): Promise<void> {
  const [row] = await ctx.db
    .select({ id: accommodations.id })
    .from(accommodations)
    .where(
      and(
        eq(accommodations.id, accommodationId),
        or(isNull(accommodations.organizationId), eq(accommodations.organizationId, ctx.orgId)),
      ),
    )
    .limit(1);
  if (!row) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Accommodation not found' });
  }
}

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

      const orgId = await resolveOptionalOrgId(ctx);
      const hiddenIds = orgId ? await getHiddenImageIds(ctx.db, orgId) : [];

      const conditions = [accVisibleWhere(orgId)];
      if (input?.query) {
        conditions.push(ilike(accommodations.name, `%${escapeLikeQuery(input.query)}%`));
      }

      const whereClause = and(...conditions);

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
              .where(
                and(
                  inArray(accommodationImages.accommodationId, accIds),
                  orgId
                    ? or(
                        isNull(accommodationImages.organizationId),
                        eq(accommodationImages.organizationId, orgId),
                      )
                    : isNull(accommodationImages.organizationId),
                  // Drop images this org has hidden.
                  hiddenIds.length ? notInArray(accommodationImages.id, hiddenIds) : undefined,
                ),
              )
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
      const orgId = await resolveOptionalOrgId(ctx);
      const hiddenIds = orgId ? await getHiddenImageIds(ctx.db, orgId) : [];
      return (
        (await ctx.db.query.accommodations.findFirst({
          where: and(eq(accommodations.id, input.id), accVisibleWhere(orgId)),
          with: {
          images: {
            where: (img, { and, or, eq, isNull, notInArray }) =>
              and(
                orgId
                  ? or(isNull(img.organizationId), eq(img.organizationId, orgId))
                  : isNull(img.organizationId),
                hiddenIds.length ? notInArray(img.id, hiddenIds) : undefined,
              )!,
          },
        },
        })) ?? null
      );
    }),

  // Lightweight lookup for itinerary builder (first image only)
  getLookup: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = await resolveOptionalOrgId(ctx);
      const hiddenIds = orgId ? await getHiddenImageIds(ctx.db, orgId) : [];
      return (
        (await ctx.db.query.accommodations.findFirst({
          where: and(eq(accommodations.id, input.id), accVisibleWhere(orgId)),
          with: {
          images: {
            where: (img, { and, or, eq, isNull, notInArray }) =>
              and(
                orgId
                  ? or(isNull(img.organizationId), eq(img.organizationId, orgId))
                  : isNull(img.organizationId),
                hiddenIds.length ? notInArray(img.id, hiddenIds) : undefined,
              )!,
            limit: 1,
          },
        },
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
      const orgId = await resolveOptionalOrgId(ctx);
      const hiddenIds = orgId ? await getHiddenImageIds(ctx.db, orgId) : [];

      if (!trimmed) {
        return ctx.db.query.accommodations.findMany({
          where: accVisibleWhere(orgId),
          limit: input.limit,
          with: {
          images: {
            where: (img, { and, or, eq, isNull, notInArray }) =>
              and(
                orgId
                  ? or(isNull(img.organizationId), eq(img.organizationId, orgId))
                  : isNull(img.organizationId),
                hiddenIds.length ? notInArray(img.id, hiddenIds) : undefined,
              )!,
            limit: 1,
          },
        },
        });
      }
      return ctx.db.query.accommodations.findMany({
        where: and(ilike(accommodations.name, `%${escapeLikeQuery(trimmed)}%`), accVisibleWhere(orgId)),
        limit: input.limit,
        with: {
          images: {
            where: (img, { and, or, eq, isNull, notInArray }) =>
              and(
                orgId
                  ? or(isNull(img.organizationId), eq(img.organizationId, orgId))
                  : isNull(img.organizationId),
                hiddenIds.length ? notInArray(img.id, hiddenIds) : undefined,
              )!,
            limit: 1,
          },
        },
      });
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const orgId = await resolveOptionalOrgId(ctx);
    const hiddenIds = orgId ? await getHiddenImageIds(ctx.db, orgId) : [];
    const results = await ctx.db.query.accommodations.findMany({
      where: accVisibleWhere(orgId),
      with: {
        images: {
          where: (img, { and, or, eq, isNull, notInArray }) =>
            and(
              orgId
                ? or(isNull(img.organizationId), eq(img.organizationId, orgId))
                : isNull(img.organizationId),
              hiddenIds.length ? notInArray(img.id, hiddenIds) : undefined,
            )!,
        },
      },
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
        enhancedDescription: z.string().max(10000).optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        images: z.array(uploadedImageSchema).max(20).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const [newAcc] = await tx
          .insert(accommodations)
          .values({
            name: input.name,
            url: input.url || undefined,
            overview: input.overview,
            description: input.description,
            enhancedDescription: input.enhancedDescription,
            latitude: input.latitude,
            longitude: input.longitude,
            // New lodges are private to the creating org.
            organizationId: ctx.orgId,
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
            await tx.insert(accommodationImages).values({
              accommodationId: newAcc.id,
              bucket: img.bucket,
              key: img.key,
              organizationId: ctx.orgId,
            });
          }
        }

        return { id: newAcc.id };
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255),
        url: z.string().url().optional().or(z.literal('')),
        overview: z.string().max(1000).optional(),
        description: z.string().max(5000).optional(),
        enhancedDescription: z.string().max(10000).optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        newImages: z.array(uploadedImageSchema).max(20).optional(),
        removedImageIds: z.array(z.string()).max(50).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, newImages, removedImageIds, ...data } = input;

      // Can't edit another org's private lodge (global + own are allowed).
      await assertAccommodationVisible(ctx, id);

      await ctx.db
        .update(accommodations)
        .set({
          name: data.name,
          url: data.url || undefined,
          overview: data.overview,
          description: data.description,
          enhancedDescription: data.enhancedDescription,
          latitude: data.latitude,
          longitude: data.longitude,
        })
        .where(eq(accommodations.id, id));

      if (removedImageIds && removedImageIds.length > 0) {
        // Only an org's own images are removable here; curated/global images
        // (organizationId IS NULL) and other orgs' images are never touched.
        await ctx.db.delete(accommodationImages).where(
          and(
            eq(accommodationImages.accommodationId, id),
            inArray(accommodationImages.id, removedImageIds),
            eq(accommodationImages.organizationId, ctx.orgId),
          ),
        );
      }

      if (newImages && newImages.length > 0) {
        for (const img of newImages) {
          await ctx.db.insert(accommodationImages).values({
            accommodationId: id,
            bucket: img.bucket,
            key: img.key,
            organizationId: ctx.orgId,
          });
        }
      }

      return { success: true };
    }),

  // Images a viewer may see for one accommodation: curated/global + this org's
  // own. Unlike the public readers, this KEEPS images the org has hidden and
  // flags them (`isHidden`) so the edit gallery can offer Unhide. `isOwn` gates
  // hard deletion (own images) vs hide (curated images).
  listImages: protectedProcedure
    .input(z.object({ accommodationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertAccommodationVisible(ctx, input.accommodationId);
      const [rows, hiddenIds] = await Promise.all([
        ctx.db
          .select()
          .from(accommodationImages)
          .where(
            and(
              eq(accommodationImages.accommodationId, input.accommodationId),
              or(
                isNull(accommodationImages.organizationId),
                eq(accommodationImages.organizationId, ctx.orgId),
              ),
            ),
          ),
        getHiddenImageIds(ctx.db, ctx.orgId),
      ]);
      const hidden = new Set(hiddenIds);

      return rows.map((img) => ({
        id: img.id,
        url: getPublicUrl(img.bucket, img.key),
        isOwn: img.organizationId === ctx.orgId,
        isHidden: hidden.has(img.id),
      }));
    }),

  // Issue presigned PUT URLs so the browser uploads each file straight to R2,
  // bypassing the serverless body-size limit ("Payload too large"). Keys are
  // namespaced per org so the bucket stays tidy and self-documenting.
  createUploadUrls: protectedProcedure
    .input(
      z.object({
        accommodationId: z.string().uuid(),
        files: z
          .array(
            z.object({
              name: z.string().min(1).max(200),
              contentType: z.enum(
                ALLOWED_UPLOAD_CONTENT_TYPES as unknown as [string, ...string[]],
              ),
              size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
            }),
          )
          .min(1)
          .max(20),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertAccommodationVisible(ctx, input.accommodationId);
      const prefix = `accommodations/${input.accommodationId}/org/${ctx.orgId}`;
      return Promise.all(
        input.files.map((file, i) =>
          getSignedUploadUrl({
            key: `${prefix}/${Date.now()}-${i}-${sanitizeFilename(file.name)}`,
            contentType: file.contentType,
          }).then((r) => ({ uploadUrl: r.url, key: r.key, bucket: r.bucket })),
        ),
      );
    }),

  // Attach already-uploaded (R2) images to an accommodation, scoped to this org.
  addImages: protectedProcedure
    .input(
      z.object({
        accommodationId: z.string(),
        images: z.array(uploadedImageSchema).min(1).max(20),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertAccommodationVisible(ctx, input.accommodationId);
      await ctx.db.insert(accommodationImages).values(
        input.images.map((img) => ({
          accommodationId: input.accommodationId,
          bucket: img.bucket,
          key: img.key,
          organizationId: ctx.orgId,
        })),
      );
      return { added: input.images.length };
    }),

  // Delete one of this org's own images. Curated/global and other orgs'
  // images can never be deleted through this path.
  removeImage: protectedProcedure
    .input(z.object({ imageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(accommodationImages)
        .where(
          and(
            eq(accommodationImages.id, input.imageId),
            eq(accommodationImages.organizationId, ctx.orgId),
          ),
        )
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete images your organization added.',
        });
      }

      await ctx.db.delete(accommodationImages).where(eq(accommodationImages.id, input.imageId));

      // Best-effort removal of the R2 object; the row is already gone either way.
      try {
        await deleteFromStorage(row.key);
      } catch {
        // ignore storage cleanup failures
      }

      return { success: true };
    }),

  // Hide a curated/global image from THIS org only. The shared image record is
  // untouched, so every other org still sees it. Reversible via unhideImage.
  hideImage: protectedProcedure
    .input(z.object({ imageId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [img] = await ctx.db
        .select({ id: accommodationImages.id, organizationId: accommodationImages.organizationId })
        .from(accommodationImages)
        .where(eq(accommodationImages.id, input.imageId))
        .limit(1);

      if (!img) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Image not found' });
      }
      // Only curated/global images are hideable. An org's own image should be
      // deleted, not hidden; another org's private image isn't visible here.
      if (img.organizationId !== null) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only shared library images can be hidden. Delete your own images instead.',
        });
      }

      await ctx.db
        .insert(hiddenAccommodationImages)
        .values({ organizationId: ctx.orgId, imageId: input.imageId })
        .onConflictDoNothing();

      return { success: true };
    }),

  // Restore a previously hidden curated image for this org.
  unhideImage: protectedProcedure
    .input(z.object({ imageId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(hiddenAccommodationImages)
        .where(
          and(
            eq(hiddenAccommodationImages.organizationId, ctx.orgId),
            eq(hiddenAccommodationImages.imageId, input.imageId),
          ),
        );
      return { success: true };
    }),
});
