'use server';

import { accommodations, db } from '@repo/db';
import { desc, sql } from 'drizzle-orm';

export async function getAccommodationsWithContentStatus(options?: {
  page?: number;
  limit?: number;
  query?: string;
}) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const query = options?.query || '';
  const offset = (page - 1) * limit;

  const filters = query ? sql`lower(${accommodations.name}) LIKE ${`%${query.toLowerCase()}%`}` : undefined;

  const [data, total] = await Promise.all([
    db
      .select({
        id: accommodations.id,
        name: accommodations.name,
        url: accommodations.url,
        contentStatus: accommodations.contentStatus,
        lastFetchedAt: accommodations.contentLastFetchedAt,
      })
      .from(accommodations)
      .where(filters)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(accommodations.name)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(accommodations)
      .where(filters)
      .then((res) => Number(res[0]?.count || 0)),
  ]);

  return {
    accommodations: data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
