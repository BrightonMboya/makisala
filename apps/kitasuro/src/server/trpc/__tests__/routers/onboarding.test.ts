import { describe, expect, test } from 'bun:test';
import { createCallerFactory } from '../../init';
import { appRouter } from '../../router';
import { createPublicContext, createProtectedContext } from '../helpers/mock-context';

const createCaller = createCallerFactory(appRouter);

describe('onboarding router', () => {
  describe('getData', () => {
    test('requires authentication', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(caller.onboarding.getData()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    test('returns org data and tour count', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.organizations.findFirst', {
        id: 'org-1',
        name: 'Safari Co',
        logoUrl: null,
        notificationEmail: null,
        onboardingCompletedAt: null,
      });
      db._results.set('select', [{ count: 5 }]);

      const result = await caller.onboarding.getData();
      expect(result.organization).toMatchObject({ id: 'org-1', name: 'Safari Co' });
      expect(result.tourCount).toBe(5);
    });

    test('returns null org and zero count when nothing exists', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.organizations.findFirst', undefined);
      db._results.set('select', [{ count: 0 }]);

      const result = await caller.onboarding.getData();
      expect(result.organization).toBeNull();
      expect(result.tourCount).toBe(0);
    });
  });

  describe('markComplete', () => {
    test('marks onboarding as complete', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('update', { success: true });

      const result = await caller.onboarding.markComplete();
      expect(result).toEqual({ success: true });
    });

    test('requires authentication', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(caller.onboarding.markComplete()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});
