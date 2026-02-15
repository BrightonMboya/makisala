import { describe, expect, test } from 'bun:test';
import { createCallerFactory } from '../../init';
import { appRouter } from '../../router';
import { createPublicContext, createProtectedContext } from '../helpers/mock-context';

const createCaller = createCallerFactory(appRouter);

describe('activities router', () => {
  describe('search', () => {
    test('requires authentication', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(caller.activities.search({ query: '' })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    test('returns activities (global + org)', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      const mockActivities = [
        { id: 'act-1', name: 'Game Drive' },
        { id: 'act-2', name: 'Walking Safari' },
      ];
      db._results.set('select', mockActivities);

      const result = await caller.activities.search({ query: '', limit: 10 });
      expect(result).toEqual(mockActivities);
    });

    test('filters by search query', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('select', [{ id: 'act-1', name: 'Game Drive' }]);

      const result = await caller.activities.search({ query: 'game', limit: 10 });
      expect(result).toEqual([{ id: 'act-1', name: 'Game Drive' }]);
    });

    test('uses default limit of 10', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('select', []);
      const result = await caller.activities.search({ query: '' });
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    test('creates activity and returns id/name', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('insert', [{ id: 'new-act', name: 'Hot Air Balloon' }]);

      const result = await caller.activities.create({ name: 'Hot Air Balloon' });
      expect(result).toEqual({ id: 'new-act', name: 'Hot Air Balloon' });
    });

    test('rejects empty name', async () => {
      const { ctx } = createProtectedContext();
      const caller = createCaller(ctx);

      await expect(caller.activities.create({ name: '' })).rejects.toThrow();
    });

    test('rejects name over 255 characters', async () => {
      const { ctx } = createProtectedContext();
      const caller = createCaller(ctx);

      await expect(
        caller.activities.create({ name: 'x'.repeat(256) }),
      ).rejects.toThrow();
    });
  });
});
