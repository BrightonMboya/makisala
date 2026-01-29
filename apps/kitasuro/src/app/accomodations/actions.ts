'use server';

import { accommodationImages, accommodations, db } from '@repo/db';
import { and, desc, eq, ilike, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { uploadToStorage } from '@/lib/storage';
import { compressImage, replaceExtension } from '@/lib/image-utils';
import { z } from 'zod';

const imageSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  base64: z.string().min(1),
});

const createAccommodationSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url().optional().or(z.literal('')),
  overview: z.string().max(1000).optional(),
  description: z.string().max(5000).optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  images: z.array(imageSchema).optional(),
});

const updateAccommodationSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url().optional().or(z.literal('')),
  overview: z.string().max(1000).optional(),
  description: z.string().max(5000).optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  newImages: z.array(imageSchema).optional(),
  removedImageIds: z.array(z.string()).optional(),
});

export async function getAccommodations(options?: {
  query?: string;
  page?: number;
  limit?: number;
}) {
  const page = options?.page || 1;
  const limit = options?.limit || 10;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (options?.query) {
    conditions.push(ilike(accommodations.name, `%${options.query}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, total] = await Promise.all([
    db
      .select()
      .from(accommodations)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(accommodations.name)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(accommodations)
      .where(whereClause)
      .then((res) => Number(res[0]?.count || 0)),
  ]);

  // Fetch images for these accommodations
  const accIds = data.map((acc) => acc.id);
  const images =
    accIds.length > 0
      ? await db
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
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAccommodationById(id: string) {
  if (!id || typeof id !== 'string') {
    return null;
  }

  try {
    const [acc] = await db.select().from(accommodations).where(eq(accommodations.id, id)).limit(1);

    if (!acc) return null;

    const images = await db
      .select()
      .from(accommodationImages)
      .where(eq(accommodationImages.accommodationId, id));

    return {
      ...acc,
      images,
    };
  } catch (error) {
    console.error('Database error in getAccommodationById:', error);
    return null;
  }
}

export async function createAccommodation(data: z.infer<typeof createAccommodationSchema>) {
  const parsed = createAccommodationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input data' };
  }

  const validated = parsed.data;

  try {
    const [newAcc] = await db
      .insert(accommodations)
      .values({
        name: validated.name,
        url: validated.url || undefined,
        overview: validated.overview,
        description: validated.description,
        latitude: validated.latitude,
        longitude: validated.longitude,
      })
      .returning();

    if (!newAcc) {
      return { success: false, error: 'Failed to create accommodation' };
    }

    if (validated.images && validated.images.length > 0) {
      for (const img of validated.images) {
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

        await db.insert(accommodationImages).values({
          accommodationId: newAcc.id,
          bucket,
          key: storageKey,
        });
      }
    }

    revalidatePath('/accomodations');
    return { success: true, id: newAcc.id };
  } catch (error) {
    console.error('Error creating accommodation:', error);
    return { success: false, error: 'Failed to create accommodation' };
  }
}

export async function updateAccommodation(
  id: string,
  data: z.infer<typeof updateAccommodationSchema>,
) {
  if (!id || typeof id !== 'string') {
    return { success: false, error: 'Invalid accommodation ID' };
  }

  const parsed = updateAccommodationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input data' };
  }

  const validated = parsed.data;

  try {
    await db
      .update(accommodations)
      .set({
        name: validated.name,
        url: validated.url || undefined,
        overview: validated.overview,
        description: validated.description,
        latitude: validated.latitude,
        longitude: validated.longitude,
      })
      .where(eq(accommodations.id, id));

    if (validated.removedImageIds && validated.removedImageIds.length > 0) {
      await db.delete(accommodationImages).where(
        and(
          eq(accommodationImages.accommodationId, id),
          inArray(accommodationImages.id, validated.removedImageIds),
        ),
      );
    }

    if (validated.newImages && validated.newImages.length > 0) {
      for (const img of validated.newImages) {
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

        await db.insert(accommodationImages).values({
          accommodationId: id,
          bucket,
          key: storageKey,
        });
      }
    }

    revalidatePath('/accomodations');
    revalidatePath(`/accomodations/${id}/edit`);
    return { success: true };
  } catch (error) {
    console.error('Error updating accommodation:', error);
    return { success: false, error: 'Failed to update accommodation' };
  }
}

export async function getAccommodationWithContent(id: string) {
  if (!id || typeof id !== 'string') {
    return null;
  }

  try {
    const [acc] = await db.select().from(accommodations).where(eq(accommodations.id, id)).limit(1);

    if (!acc) return null;

    const images = await db
      .select()
      .from(accommodationImages)
      .where(eq(accommodationImages.accommodationId, id));

    return {
      ...acc,
      images,
    };
  } catch (error) {
    console.error('Database error in getAccommodationWithContent:', error);
    return null;
  }
}
