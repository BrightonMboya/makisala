import { describe, expect, test } from 'bun:test';
import { createCallerFactory } from '../../init';
import { appRouter } from '../../router';
import { createPublicContext } from '../helpers/mock-context';

const createCaller = createCallerFactory(appRouter);

describe('nationalParks router', () => {
  describe('getAll', () => {
    test('returns all national parks with correct fields', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      const mockParks = [
        { id: 'park-1', name: 'Serengeti', overview_page_id: null, latitude: '-2.33', longitude: '34.83', park_overview: 'Great migration' },
        { id: 'park-2', name: 'Ngorongoro', overview_page_id: null, latitude: '-3.17', longitude: '35.58', park_overview: 'Crater' },
      ];
      db._results.set('select', mockParks);

      const result = await caller.nationalParks.getAll();
      expect(result).toEqual(mockParks);
    });

    test('returns empty array when no parks', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('select', []);
      const result = await caller.nationalParks.getAll();
      expect(result).toEqual([]);
    });
  });

  describe('search', () => {
    test('returns parks matching query', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('select', [{ id: 'park-1', name: 'Serengeti' }]);

      const result = await caller.nationalParks.search({ query: 'seren', limit: 10 });
      expect(result).toEqual([{ id: 'park-1', name: 'Serengeti' }]);
    });

    test('returns all parks when query is empty', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      const mockParks = [
        { id: 'park-1', name: 'Serengeti' },
        { id: 'park-2', name: 'Ngorongoro' },
      ];
      db._results.set('select', mockParks);

      const result = await caller.nationalParks.search({ query: '', limit: 20 });
      expect(result).toEqual(mockParks);
    });

    test('uses default limit of 20', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('select', []);
      await caller.nationalParks.search({ query: '' });
      // Should not throw — default limit is applied
    });
  });

  describe('getById', () => {
    test('returns park when found', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.nationalParks.findFirst', { id: 'park-1', name: 'Serengeti' });

      const result = await caller.nationalParks.getById({ id: 'park-1' });
      expect(result).toEqual({ id: 'park-1', name: 'Serengeti' });
    });

    test('returns null when park not found', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.nationalParks.findFirst', undefined);

      const result = await caller.nationalParks.getById({ id: 'nonexistent' });
      expect(result).toBeNull();
    });
  });
});
