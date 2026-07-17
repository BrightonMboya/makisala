import 'server-only';
import { listStorageImages } from '@/lib/storage';
import type { Day } from '@/types/itinerary-types';

/**
 * Curated destination photography for the day intro pages, from R2 under
 * `national-parks/<id>/`. There's no DB relation for these — the prefix *is* the
 * index — so they're listed at render time.
 */

/** Photos per destination id. Missing ids have no entry. */
export type DestinationPhotos = Map<string, string[]>;

async function listForDestination(id: string): Promise<string[]> {
  try {
    const images = await listStorageImages('', `national-parks/${id}`);
    // Sorted because S3 doesn't contract listing order, which would otherwise
    // reshuffle a proposal's photos between renders. seededShuffle picks the order.
    return images.map((image) => image.url).sort();
  } catch {
    // Callers fall back to lodge imagery; this must never fail a render.
    return [];
  }
}

/** Deduplicated: a park revisited on days 2 and 4 is listed once. */
export async function resolveDestinationPhotos(days: Day[]): Promise<DestinationPhotos> {
  const ids = [...new Set(days.map((day) => day.destinationId).filter((id): id is string => !!id))];

  const entries = await Promise.all(
    ids.map(async (id) => [id, await listForDestination(id)] as const),
  );

  const photos: DestinationPhotos = new Map();
  for (const [id, urls] of entries) {
    if (urls.length > 0) photos.set(id, urls);
  }
  return photos;
}
