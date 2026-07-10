import { eq } from 'drizzle-orm';
import { hiddenAccommodationImages } from '@repo/db/schema';
import type { db } from '@repo/db';

/**
 * Image ids this org has hidden from its own gallery + proposals. Curated
 * images stay in the shared catalog for every other org; this org just
 * suppresses them. Returns an empty array for orgs that have hidden nothing.
 */
export async function getHiddenImageIds(database: typeof db, orgId: string): Promise<string[]> {
  const rows = await database
    .select({ imageId: hiddenAccommodationImages.imageId })
    .from(hiddenAccommodationImages)
    .where(eq(hiddenAccommodationImages.organizationId, orgId));
  return rows.map((r) => r.imageId);
}
