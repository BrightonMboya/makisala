import { describe, expect, test } from 'bun:test';
import { createCallerFactory } from '../../init';
import { appRouter } from '../../router';
import { createPublicContext, createProtectedContext } from '../helpers/mock-context';

const createCaller = createCallerFactory(appRouter);

describe('clients router', () => {
  describe('list', () => {
    test('requires authentication', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(caller.clients.list()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    test('returns clients for org', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      const mockClients = [
        { id: '1', name: 'Client A', organizationId: 'org-1' },
        { id: '2', name: 'Client B', organizationId: 'org-1' },
      ];
      db._results.set('select', mockClients);

      const result = await caller.clients.list({ page: 1, limit: 10 });
      expect(result.clients).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    test('detects hasNextPage when more results exist', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      // Return limit + 1 items to trigger hasNextPage
      const mockClients = Array.from({ length: 3 }, (_, i) => ({
        id: `${i}`,
        name: `Client ${i}`,
      }));
      db._results.set('select', mockClients);

      const result = await caller.clients.list({ page: 1, limit: 2 });
      expect(result.clients).toHaveLength(2);
      expect(result.pagination.hasNextPage).toBe(true);
    });

    test('hasNextPage is false when fewer results', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('select', [{ id: '1', name: 'Client A' }]);

      const result = await caller.clients.list({ page: 1, limit: 10 });
      expect(result.pagination.hasNextPage).toBe(false);
    });

    test('handles database error on list', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('select', new Error('connection refused'));

      await expect(caller.clients.list()).rejects.toThrow('connection refused');
    });

    test('uses default pagination when no input', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('select', []);
      const result = await caller.clients.list();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe('getById', () => {
    test('returns client when found', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      const mockClient = { id: 'c-1', name: 'Client A', organizationId: 'org-1' };
      db._results.set('select', [mockClient]);

      const result = await caller.clients.getById({ id: 'c-1' });
      expect(result).toEqual(mockClient);
    });

    test('throws NOT_FOUND when client not found', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('select', []);

      await expect(caller.clients.getById({ id: 'nonexistent' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  describe('create', () => {
    test('creates client and returns id', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('insert', [{ id: 'new-1', name: 'New Client' }]);

      const result = await caller.clients.create({ name: 'New Client' });
      expect(result).toEqual({ id: 'new-1' });
    });

    test('rejects empty name', async () => {
      const { ctx } = createProtectedContext();
      const caller = createCaller(ctx);

      await expect(caller.clients.create({ name: '' })).rejects.toThrow();
    });

    test('accepts optional fields', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('insert', [{ id: 'new-2' }]);

      const result = await caller.clients.create({
        name: 'Client With Details',
        email: 'client@example.com',
        phone: '+1234567890',
        countryOfResidence: 'Tanzania',
        notes: 'VIP client',
      });
      expect(result).toEqual({ id: 'new-2' });
    });

    test('rejects invalid email', async () => {
      const { ctx } = createProtectedContext();
      const caller = createCaller(ctx);

      await expect(
        caller.clients.create({ name: 'Client', email: 'not-an-email' }),
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    test('updates client successfully', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('update', { success: true });

      const result = await caller.clients.update({ id: 'c-1', name: 'Updated Name' });
      expect(result).toEqual({ success: true });
    });
  });

  describe('delete', () => {
    test('deletes client successfully', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('delete', { success: true });

      const result = await caller.clients.delete({ id: 'c-1' });
      expect(result).toEqual({ success: true });
    });
  });
});
