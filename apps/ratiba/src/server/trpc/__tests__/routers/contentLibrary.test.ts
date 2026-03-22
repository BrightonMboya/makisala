import { describe, expect, test } from 'bun:test';
import { createCallerFactory } from '../../init';
import { appRouter } from '../../router';
import { createPublicContext, createProtectedContext } from '../helpers/mock-context';

const createCaller = createCallerFactory(appRouter);

describe('contentLibrary router', () => {
  describe('getAccommodationsWithStatus', () => {
    test('requires authentication', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(
        caller.contentLibrary.getAccommodationsWithStatus(),
      ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    test('returns accommodations with pagination', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.accommodations.findMany', [
        { id: 'acc-1', name: 'Lodge A', url: null, images: [{ bucket: 'r2', key: 'img.webp' }] },
      ]);
      db._results.set('select', [{ count: 1 }]);

      const result = await caller.contentLibrary.getAccommodationsWithStatus({
        page: 1,
        limit: 20,
        query: '',
      });
      expect(result.accommodations).toHaveLength(1);
      expect(result.accommodations[0].imageUrl).toContain('img.webp');
      expect(result.pagination.page).toBe(1);
    });

    test('returns null imageUrl when no images', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.accommodations.findMany', [
        { id: 'acc-1', name: 'Lodge A', url: null, images: [] },
      ]);
      db._results.set('select', [{ count: 1 }]);

      const result = await caller.contentLibrary.getAccommodationsWithStatus();
      expect(result.accommodations[0].imageUrl).toBeNull();
    });
  });

  describe('getOrgImages', () => {
    test('requires authentication', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(caller.contentLibrary.getOrgImages()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    test('returns images with cursor pagination', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('select', [
        { id: 'img-1', name: 'photo.webp', key: 'organizations/org-1/images/photo.webp', createdAt: new Date() },
      ]);

      const result = await caller.contentLibrary.getOrgImages();
      expect(result.images).toHaveLength(1);
      expect(result.images[0].url).toContain('photo.webp');
      expect(result.nextCursor).toBeNull();
    });

    test('returns nextCursor when more images exist', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      // Return limit + 1 items
      const mockImages = Array.from({ length: 21 }, (_, i) => ({
        id: `img-${i}`,
        name: `photo-${i}.webp`,
        key: `organizations/org-1/images/photo-${i}.webp`,
        createdAt: new Date(2024, 0, i + 1),
      }));
      db._results.set('select', mockImages);

      const result = await caller.contentLibrary.getOrgImages({ limit: 20 });
      expect(result.images).toHaveLength(20);
      expect(result.nextCursor).toBeTruthy();
    });
  });

  describe('uploadImage', () => {
    test('requires authentication', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(
        caller.contentLibrary.uploadImage({
          name: 'test.jpg',
          type: 'image/jpeg',
          base64: Buffer.from('fake').toString('base64'),
        }),
      ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    test('uploads and returns image data', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('insert', [
        { id: 'img-1', name: 'test.webp', key: 'organizations/org-1/images/test.webp' },
      ]);

      const result = await caller.contentLibrary.uploadImage({
        name: 'test.jpg',
        type: 'image/jpeg',
        base64: Buffer.from('fake-image-data').toString('base64'),
      });
      expect(result.id).toBe('img-1');
      expect(result.name).toBe('test.webp');
      expect(result.url).toContain('test.webp');
    });

    test('rejects invalid image type', async () => {
      const { ctx } = createProtectedContext();
      const caller = createCaller(ctx);

      await expect(
        caller.contentLibrary.uploadImage({
          name: 'test.svg',
          type: 'image/svg+xml' as any,
          base64: Buffer.from('fake').toString('base64'),
        }),
      ).rejects.toThrow();
    });

    test('rejects empty name', async () => {
      const { ctx } = createProtectedContext();
      const caller = createCaller(ctx);

      await expect(
        caller.contentLibrary.uploadImage({
          name: '',
          type: 'image/jpeg',
          base64: Buffer.from('fake').toString('base64'),
        }),
      ).rejects.toThrow();
    });
  });

  describe('deleteImage', () => {
    test('requires authentication', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(
        caller.contentLibrary.deleteImage({ imageId: 'img-1' }),
      ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    test('deletes image from storage and db', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('select', [
        { id: 'img-1', key: 'organizations/org-1/images/photo.webp' },
      ]);
      db._results.set('delete', { success: true });

      const result = await caller.contentLibrary.deleteImage({ imageId: 'img-1' });
      expect(result).toEqual({ success: true });
    });

    test('throws NOT_FOUND when image not found', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('select', []);

      await expect(
        caller.contentLibrary.deleteImage({ imageId: 'nonexistent' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
