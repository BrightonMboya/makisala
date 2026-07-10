import { describe, expect, test } from 'bun:test';
import { createCallerFactory } from '../../init';
import { appRouter } from '../../router';
import { createProtectedContext, createPublicContext } from '../helpers/mock-context';

const createCaller = createCallerFactory(appRouter);

describe('accommodations router', () => {
  describe('list', () => {
    test('returns accommodations with pagination (public)', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      const mockAccommodations = [
        { id: 'acc-1', name: 'Lodge A' },
        { id: 'acc-2', name: 'Lodge B' },
      ];
      // First select: accommodations data, second: count, third: images
      db._results.set('select', mockAccommodations);

      const result = await caller.accommodations.list({ page: 1, limit: 10 });
      expect(result.accommodations).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
    });

    test('uses default pagination when no input', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('select', []);

      const result = await caller.accommodations.list();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe('getById', () => {
    test('returns accommodation with images (public)', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      const mockAcc = { id: 'acc-1', name: 'Lodge A', overview: 'Great lodge' };
      // First select returns the accommodation, second returns images
      db._results.set('select', [mockAcc]);

      const result = await caller.accommodations.getById({ id: 'acc-1' });
      expect(result).toBeDefined();
    });

    test('returns null when not found', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('select', []);

      const result = await caller.accommodations.getById({ id: 'nonexistent' });
      expect(result).toBeNull();
    });
  });

  describe('getLookup', () => {
    test('returns accommodation with first image (public)', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.accommodations.findFirst', {
        id: 'acc-1',
        name: 'Lodge A',
        images: [{ bucket: 'r2', key: 'img-1.webp' }],
      });

      const result = await caller.accommodations.getLookup({ id: 'acc-1' });
      expect(result?.id).toBe('acc-1');
      expect(result?.images).toHaveLength(1);
    });

    test('returns null when not found', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.accommodations.findFirst', undefined);

      const result = await caller.accommodations.getLookup({ id: 'nonexistent' });
      expect(result).toBeNull();
    });
  });

  describe('search', () => {
    test('returns accommodations matching query (public)', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.accommodations.findMany', [
        { id: 'acc-1', name: 'Serena Lodge', images: [] },
      ]);

      const result = await caller.accommodations.search({ query: 'serena', limit: 10 });
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Serena Lodge');
    });

    test('returns all when query is empty', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.accommodations.findMany', [
        { id: 'acc-1', name: 'Lodge A', images: [] },
        { id: 'acc-2', name: 'Lodge B', images: [] },
      ]);

      const result = await caller.accommodations.search({ query: '' });
      expect(result).toHaveLength(2);
    });
  });

  describe('getAll', () => {
    test('returns all accommodations with image URLs', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.accommodations.findMany', [
        {
          id: 'acc-1',
          name: 'Lodge A',
          images: [{ bucket: 'r2', key: 'accommodations/acc-1/img.webp' }],
        },
      ]);

      const result = await caller.accommodations.getAll();
      expect(result).toHaveLength(1);
      expect(result[0]!.images[0]!.url).toContain('accommodations/acc-1/img.webp');
    });
  });

  describe('create', () => {
    test('requires authentication', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(caller.accommodations.create({ name: 'New Lodge' })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    test('creates accommodation without images', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      // create() runs inside ctx.db.transaction, so the insert routes through the tx.insert key
      db._results.set('tx.insert', [{ id: 'new-acc', name: 'New Lodge' }]);

      const result = await caller.accommodations.create({ name: 'New Lodge' });
      expect(result).toEqual({ id: 'new-acc' });
    });

    test('rejects empty name', async () => {
      const { ctx } = createProtectedContext();
      const caller = createCaller(ctx);

      await expect(caller.accommodations.create({ name: '' })).rejects.toThrow();
    });
  });

  describe('update', () => {
    test('requires authentication', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(
        caller.accommodations.update({ id: 'acc-1', name: 'Updated' }),
      ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    test('updates accommodation fields', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      // Visibility guard: the lodge is global/own, so it resolves.
      db._results.set('select', [{ id: 'acc-1' }]);
      db._results.set('update', { success: true });
      db._results.set('delete', { success: true });

      const result = await caller.accommodations.update({
        id: 'acc-1',
        name: 'Updated Lodge',
        overview: 'Updated overview',
      });
      expect(result).toEqual({ success: true });
    });

    test('rejects editing a lodge the org cannot see', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      // Visibility guard finds no matching (global or own) row -> 404.
      db._results.set('select', []);

      await expect(
        caller.accommodations.update({ id: 'other-org-lodge', name: 'Hijack' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('hideImage', () => {
    const IMG_ID = '11111111-1111-4111-8111-111111111111';

    test('requires authentication', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(caller.accommodations.hideImage({ imageId: IMG_ID })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    test('hides a curated (global) image for the org', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      // Image lookup: a curated image has organizationId null.
      db._results.set('select', [{ id: IMG_ID, organizationId: null }]);

      const result = await caller.accommodations.hideImage({ imageId: IMG_ID });
      expect(result).toEqual({ success: true });
    });

    test('refuses to hide the org\'s own image (should be deleted instead)', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('select', [{ id: IMG_ID, organizationId: 'org-1' }]);

      await expect(caller.accommodations.hideImage({ imageId: IMG_ID })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });
    });

    test('404s when the image does not exist', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('select', []);

      await expect(caller.accommodations.hideImage({ imageId: IMG_ID })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  describe('unhideImage', () => {
    const IMG_ID = '22222222-2222-4222-8222-222222222222';

    test('unhides an image for the org', async () => {
      const { ctx } = createProtectedContext();
      const caller = createCaller(ctx);

      const result = await caller.accommodations.unhideImage({ imageId: IMG_ID });
      expect(result).toEqual({ success: true });
    });
  });
});
