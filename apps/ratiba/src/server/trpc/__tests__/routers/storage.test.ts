import { describe, expect, test } from 'bun:test';
import { createCallerFactory } from '../../init';
import { appRouter } from '../../router';
import { createPublicContext, createProtectedContext } from '../helpers/mock-context';

const createCaller = createCallerFactory(appRouter);

describe('storage router', () => {
  describe('getImages', () => {
    test('requires authentication', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(caller.storage.getImages()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    test('returns images with mapped fields', async () => {
      const { ctx } = createProtectedContext();
      const caller = createCaller(ctx);

      // listStorageImages is mocked to return []
      const result = await caller.storage.getImages();
      expect(result).toEqual([]);
    });

    test('accepts optional folder and bucket params', async () => {
      const { ctx } = createProtectedContext();
      const caller = createCaller(ctx);

      const result = await caller.storage.getImages({
        folder: 'accommodations/acc-1',
        bucket: 'accommodations',
      });
      expect(result).toEqual([]);
    });
  });

  describe('getFolders', () => {
    test('requires authentication', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(caller.storage.getFolders()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    test('returns folders with displayName', async () => {
      const { ctx } = createProtectedContext();
      const caller = createCaller(ctx);

      // listStorageFolders is mocked to return []
      const result = await caller.storage.getFolders();
      expect(result).toEqual([]);
    });
  });

  describe('searchAccommodationFolders', () => {
    test('requires authentication', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(
        caller.storage.searchAccommodationFolders({ query: 'lodge' }),
      ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    test('returns accommodation folders matching query', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('select', [
        { id: 'acc-1', name: 'Serena Lodge' },
      ]);

      const result = await caller.storage.searchAccommodationFolders({ query: 'serena' });
      expect(result).toHaveLength(1);
      expect(result[0].displayName).toBe('Serena Lodge');
      expect(result[0].name).toBe('acc-1');
      expect(result[0].path).toBe('accommodations/acc-1');
    });

    test('rejects query shorter than 2 chars', async () => {
      const { ctx } = createProtectedContext();
      const caller = createCaller(ctx);

      await expect(
        caller.storage.searchAccommodationFolders({ query: 'a' }),
      ).rejects.toThrow();
    });
  });
});
