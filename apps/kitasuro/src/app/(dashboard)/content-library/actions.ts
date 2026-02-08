'use server';

import { accommodations, db, member, organizationImages } from '@repo/db';
import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm';
import { getPublicUrl, uploadToStorage } from '@/lib/storage';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { compressImage, replaceExtension } from '@/lib/image-utils';
import { z } from 'zod';

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

const uploadImageSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  base64: z.string().min(1),
});

export async function getOrganizationImages() {
  const session = await getSessionWithOrg();
  if (!session) return [];

  try {
    const images = await db
      .select({
        id: organizationImages.id,
        name: organizationImages.name,
        key: organizationImages.key,
        createdAt: organizationImages.createdAt,
      })
      .from(organizationImages)
      .where(eq(organizationImages.organizationId, session.orgId))
      .orderBy(desc(organizationImages.createdAt));

    return images.map((img) => ({
      ...img,
      url: getPublicUrl('', img.key),
    }));
  } catch (error) {
    console.error('Error fetching organization images:', error);
    return [];
  }
}

export async function uploadOrganizationImage(data: z.infer<typeof uploadImageSchema>) {
  const session = await getSessionWithOrg();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = uploadImageSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input data' };
  }

  const { name, base64 } = parsed.data;

  try {
    const rawBuffer = Buffer.from(base64, 'base64');
    const compressed = await compressImage(rawBuffer);
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
    // Verify the image belongs to this organization
    const [image] = await db
      .select({ id: organizationImages.id })
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

    await db.delete(organizationImages).where(eq(organizationImages.id, imageId));

    revalidatePath('/content-library');
    return { success: true };
  } catch (error) {
    console.error('Error deleting organization image:', error);
    return { success: false, error: 'Failed to delete image' };
  }
}
