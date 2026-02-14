'use server';

import { accommodations, db, member, organizationImages } from '@repo/db';
import { and, asc, desc, eq, ilike, lt, or, sql } from 'drizzle-orm';
import { deleteFromStorage, getPublicUrl, uploadToStorage } from '@/lib/storage';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { compressImage, replaceExtension } from '@/lib/image-utils';
import { z } from 'zod';
import { checkFeatureAccess } from '@/lib/plans';

// Helper: Get authenticated session with active organization
async function getSessionWithOrg() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return null;
  }

  let orgId = session.session?.activeOrganizationId as string | undefined;

  if (!orgId) {
    const [membership] = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(eq(member.userId, session.user.id))
      .limit(1);

    orgId = membership?.organizationId ?? undefined;
  }

  if (!orgId) {
    return null;
  }

  return { user: session.user, orgId };
}

export async function getAccommodationsWithContentStatus(options?: {
  page?: number;
  limit?: number;
  query?: string;
}) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const query = options?.query || '';
  const offset = (page - 1) * limit;

  try {
    const filters = query
      ? ilike(accommodations.name, `%${query}%`)
      : undefined;

    const [data, total] = await Promise.all([
      db.query.accommodations.findMany({
        columns: { id: true, name: true, url: true },
        with: {
          images: {
            columns: { bucket: true, key: true },
            limit: 1,
          },
        },
        where: filters,
        limit,
        offset,
        orderBy: asc(accommodations.name),
      }),
      db
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
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching accommodations for content library:', error);
    return {
      accommodations: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    };
  }
}

// ============ ORGANIZATION IMAGES ============

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

const uploadImageSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(ALLOWED_IMAGE_TYPES),
  base64: z.string().min(1),
});

// Cursor encodes both id and createdAt so we skip the extra lookup query
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

export async function getOrganizationImages(options?: {
  cursor?: string;
  limit?: number;
}) {
  const session = await getSessionWithOrg();
  if (!session) return { images: [], nextCursor: null };

  const limit = options?.limit ?? 20;
  const cursor = options?.cursor ? decodeCursor(options.cursor) : null;

  try {
    const conditions = [eq(organizationImages.organizationId, session.orgId)];

    if (cursor) {
      conditions.push(
        or(
          lt(organizationImages.createdAt, cursor.createdAt),
          and(
            eq(organizationImages.createdAt, cursor.createdAt),
            lt(organizationImages.id, cursor.id)
          )
        )!
      );
    }

    const images = await db
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
    const nextCursor = hasMore && lastItem
      ? encodeCursor(lastItem.id, lastItem.createdAt)
      : null;

    return {
      images: page.map((img) => ({
        ...img,
        url: getPublicUrl('', img.key),
      })),
      nextCursor,
    };
  } catch (error) {
    console.error('Error fetching organization images:', error);
    return { images: [], nextCursor: null };
  }
}

export async function uploadOrganizationImage(data: z.infer<typeof uploadImageSchema>) {
  const session = await getSessionWithOrg();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  // Check plan access for image uploads
  const access = await checkFeatureAccess(session.orgId, 'uploadImages');
  if (!access.allowed) {
    return { success: false, error: access.reason };
  }

  const parsed = uploadImageSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' };
  }

  const { name, base64 } = parsed.data;

  try {
    const rawBuffer = Buffer.from(base64, 'base64');

    // Validate file size
    if (rawBuffer.length > MAX_FILE_SIZE) {
      return { success: false, error: 'File size exceeds 10MB limit' };
    }

    // Validate actual image content using sharp
    let compressed;
    try {
      compressed = await compressImage(rawBuffer);
    } catch (err) {
      console.error('Image compression failed:', err);
      return { success: false, error: 'Unable to process image. Please try a different file.' };
    }
    const compressedName = replaceExtension(name, compressed.extension);
    const key = `organizations/${session.orgId}/images/${Date.now()}-${compressedName}`;

    await uploadToStorage({
      file: compressed.buffer,
      contentType: compressed.contentType,
      key,
      visibility: 'public',
    });

    const [newImage] = await db
      .insert(organizationImages)
      .values({
        organizationId: session.orgId,
        name: compressedName,
        key,
      })
      .returning();

    if (!newImage) {
      return { success: false, error: 'Failed to create image record' };
    }

    revalidatePath('/content-library');
    return {
      success: true,
      image: {
        id: newImage.id,
        name: newImage.name,
        url: getPublicUrl('', newImage.key),
      },
    };
  } catch (error) {
    console.error('Error uploading organization image:', error);
    return { success: false, error: 'Failed to upload image' };
  }
}

export async function deleteOrganizationImage(imageId: string) {
  const session = await getSessionWithOrg();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Get the image key before deleting
    const [image] = await db
      .select({ id: organizationImages.id, key: organizationImages.key })
      .from(organizationImages)
      .where(
        and(
          eq(organizationImages.id, imageId),
          eq(organizationImages.organizationId, session.orgId)
        )
      )
      .limit(1);

    if (!image) {
      return { success: false, error: 'Image not found' };
    }

    // Delete from R2 first
    try {
      await deleteFromStorage(image.key);
    } catch (error) {
      console.error('Failed to delete from R2:', error);
      // Continue with DB deletion to avoid orphaned records
    }

    await db.delete(organizationImages).where(eq(organizationImages.id, imageId));

    revalidatePath('/content-library');
    return { success: true };
  } catch (error) {
    console.error('Error deleting organization image:', error);
    return { success: false, error: 'Failed to delete image' };
  }
}
