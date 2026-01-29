'use server';

import { accommodations, db } from '@repo/db';
import { desc, like, sql } from 'drizzle-orm';
import { getPublicUrl } from '@/lib/storage';

export async function getAccommodationsWithContentStatus(options?: {
  page?: number;
  limit?: number;
  query?: string;
}) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const query = options?.query || '';
  const offset = (page - 1) * limit;

  const filters = query
    ? like(accommodations.name, `%${query}%`)
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
      orderBy: desc(accommodations.name),
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
}
