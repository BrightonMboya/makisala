import { z } from 'zod';
import { accommodations } from '@repo/db/schema';
import { ilike, inArray } from 'drizzle-orm';
import { router, protectedProcedure, escapeLikeQuery } from '../init';
import { listStorageFolders, listStorageImages } from '@/lib/storage';

const STORAGE_BUCKET = 'r2';
const ACCOMMODATIONS_BUCKET = 'accommodations';
const ACCOMMODATIONS_FOLDER = 'accommodations';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const storageRouter = router({
  getImages: protectedProcedure
    .input(
      z
        .object({
          folder: z.string().optional(),
          bucket: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const targetBucket = input?.bucket || STORAGE_BUCKET;
      const images = await listStorageImages(targetBucket, input?.folder);
      return images.map((img) => ({
        public_id: img.id,
        secure_url: img.url,
      }));
    }),

  getFolders: protectedProcedure
    .input(
      z
        .object({
          parentFolder: z.string().optional(),
          bucket: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const targetBucket = input?.bucket || STORAGE_BUCKET;
      const folders = await listStorageFolders(targetBucket, input?.parentFolder);

      // At root level, only expose the accommodations folder
      if (targetBucket === ACCOMMODATIONS_BUCKET && !input?.parentFolder) {
        const filtered = folders.filter((f) => f.name === ACCOMMODATIONS_FOLDER);
        return filtered.map((folder) => ({ ...folder, displayName: folder.name }));
      }

      // If we're in the accommodations folder, map UUIDs to names
      if (targetBucket === ACCOMMODATIONS_BUCKET && input?.parentFolder === ACCOMMODATIONS_FOLDER) {
        const uuidFolders = folders.filter((f) => UUID_PATTERN.test(f.name));

        if (uuidFolders.length > 0) {
          const uuids = uuidFolders.map((f) => f.name);
          const accommodationData = await ctx.db
            .select({ id: accommodations.id, name: accommodations.name })
            .from(accommodations)
            .where(inArray(accommodations.id, uuids));

          const nameMap = new Map(accommodationData.map((a) => [a.id, a.name]));

          return folders.map((folder) => ({
            ...folder,
            displayName: nameMap.get(folder.name) || folder.name,
          }));
        }
      }

      return folders.map((folder) => ({ ...folder, displayName: folder.name }));
    }),

  searchAccommodationFolders: protectedProcedure
    .input(z.object({ query: z.string().min(2) }))
    .query(async ({ ctx, input }) => {
      const results = await ctx.db
        .select({ id: accommodations.id, name: accommodations.name })
        .from(accommodations)
        .where(ilike(accommodations.name, `%${escapeLikeQuery(input.query)}%`))
        .limit(20);

      return results.map((acc) => ({
        name: acc.id,
        path: `${ACCOMMODATIONS_FOLDER}/${acc.id}`,
        displayName: acc.name,
      }));
    }),
});
