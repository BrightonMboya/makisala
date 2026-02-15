import { describe, expect, test } from 'bun:test';
import { createCallerFactory } from '../../init';
import { appRouter } from '../../router';
import { createPublicContext, createProtectedContext, createAdminContext } from '../helpers/mock-context';

const createCaller = createCallerFactory(appRouter);

describe('proposals router', () => {
  describe('listForDashboard', () => {
    test('requires authentication', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(
        caller.proposals.listForDashboard({ filter: 'all' }),
      ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    test('returns all proposals for org', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      const mockProposals = [
        { id: 'p-1', name: 'Proposal 1', status: 'draft' },
      ];
      db._results.set('query.proposals.findMany', mockProposals);

      const result = await caller.proposals.listForDashboard({ filter: 'all' });
      expect(result).toHaveLength(1);
    });

    test('returns empty array when no assignments for "mine" filter', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      // No assignments found
      db._results.set('select', []);

      const result = await caller.proposals.listForDashboard({ filter: 'mine' });
      expect(result).toEqual([]);
    });

    test('returns assigned proposals for "mine" filter', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      // Return assignment rows
      db._results.set('select', [{ proposalId: 'p-1' }]);
      db._results.set('query.proposals.findMany', [
        { id: 'p-1', name: 'My Proposal' },
      ]);

      const result = await caller.proposals.listForDashboard({ filter: 'mine' });
      expect(result).toHaveLength(1);
    });

    test('handles database error on listForDashboard', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findMany', new Error('connection failed'));

      await expect(
        caller.proposals.listForDashboard({ filter: 'all' }),
      ).rejects.toThrow('connection failed');
    });
  });

  describe('getById', () => {
    test('returns proposal with full data (public)', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', {
        id: 'p-1',
        name: 'Safari Proposal',
        organization: { name: 'Safari Co' },
        tour: { country: 'Tanzania', tourName: 'Safari' },
        client: { name: 'John', email: 'john@test.com' },
        days: [],
      });

      const result = await caller.proposals.getById({ id: 'p-1' });
      expect(result).not.toBeNull();
      expect(result!.id).toBe('p-1');
    });

    test('returns null when not found', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', undefined);

      const result = await caller.proposals.getById({ id: 'nonexistent' });
      expect(result).toBeNull();
    });

    test('handles database error on getById', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', new Error('connection failed'));

      await expect(
        caller.proposals.getById({ id: 'p-1' }),
      ).rejects.toThrow('connection failed');
    });
  });

  describe('getForBuilder', () => {
    test('requires authentication', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(
        caller.proposals.getForBuilder({ id: 'p-1' }),
      ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    test('returns proposal for builder with country', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', {
        id: 'p-1',
        name: 'Safari Proposal',
        tourId: 't-1',
        tour: { country: 'Tanzania' },
        days: [],
      });

      const result = await caller.proposals.getForBuilder({ id: 'p-1' });
      expect(result).not.toBeNull();
      expect(result!.country).toBe('Tanzania');
    });

    test('returns null when not found', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', undefined);

      const result = await caller.proposals.getForBuilder({ id: 'nonexistent' });
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    test('saves a new proposal', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      // Existing proposal check
      db._results.set('query.proposals.findFirst', undefined);
      // Transaction operations
      db._results.set('tx.insert', [{ id: 'new-prop' }]);
      db._results.set('tx.delete', { success: true });
      db._results.set('tx.select', []);

      const result = await caller.proposals.save({
        id: 'new-prop',
        name: 'New Proposal',
        tourId: 't-1',
        data: {
          tourTitle: 'Safari Trip',
          selectedTheme: 'minimalistic',
        },
      });
      expect(result.success).toBe(true);
      expect(result.id).toBe('new-prop');
    });

    test('generates UUID for empty id', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', undefined);
      db._results.set('tx.insert', [{ id: 'generated' }]);
      db._results.set('tx.delete', { success: true });
      db._results.set('tx.select', []);

      const result = await caller.proposals.save({
        id: '',
        name: 'Auto ID Proposal',
        tourId: 't-1',
        data: {},
      });
      expect(result.success).toBe(true);
      expect(result.id).toBeTruthy();
    });

    test('handles database error on save transaction', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', undefined);
      db._results.set('tx.insert', new Error('disk full'));

      await expect(
        caller.proposals.save({
          id: 'new-prop',
          name: 'New Proposal',
          tourId: 't-1',
          data: {},
        }),
      ).rejects.toThrow('disk full');
    });

    test('throws FORBIDDEN when proposal belongs to another org', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', {
        id: 'p-1',
        organizationId: 'other-org',
      });

      await expect(
        caller.proposals.save({
          id: 'p-1',
          name: 'Hack',
          tourId: 't-1',
          data: {},
        }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });
  });

  describe('assign', () => {
    test('requires admin role', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      // Return non-admin role for admin middleware check
      db._results.set('select', [{ role: 'member' }]);

      await expect(
        caller.proposals.assign({ proposalId: 'p-1', userId: 'user-2' }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    test('assigns user to proposal', async () => {
      const { ctx, db } = createAdminContext();
      const caller = createCaller(ctx);

      // After admin check (pre-configured), proposal lookup
      db._results.set('query.proposals.findFirst', { id: 'p-1' });
      // Member check — re-set select since admin check consumed the first one
      db._results.set('select', [{ userId: 'user-2' }]);
      db._results.set('insert', { success: true });

      const result = await caller.proposals.assign({ proposalId: 'p-1', userId: 'user-2' });
      expect(result).toEqual({ success: true });
    });

    test('throws NOT_FOUND when proposal not found', async () => {
      const { ctx, db } = createAdminContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', undefined);

      await expect(
        caller.proposals.assign({ proposalId: 'nonexistent', userId: 'user-2' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('unassign', () => {
    test('unassigns user from proposal', async () => {
      const { ctx, db } = createAdminContext();
      const caller = createCaller(ctx);

      db._results.set('delete', { success: true });

      const result = await caller.proposals.unassign({ proposalId: 'p-1', userId: 'user-2' });
      expect(result).toEqual({ success: true });
    });
  });

  describe('sendToClient', () => {
    test('sends proposal email to client', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', {
        id: 'p-1',
        name: 'Proposal',
        tourTitle: 'Safari Trip',
        startDate: '2024-06-01',
        client: { email: 'client@test.com', name: 'Client' },
        organization: { name: 'Safari Co' },
      });
      db._results.set('select', [{ count: 5 }]);

      const result = await caller.proposals.sendToClient({ proposalId: 'p-1' });
      expect(result).toEqual({ success: true });
    });

    test('throws NOT_FOUND when proposal not found', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', undefined);

      await expect(
        caller.proposals.sendToClient({ proposalId: 'nonexistent' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    test('throws BAD_REQUEST when client has no email', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', {
        id: 'p-1',
        client: { email: null, name: 'Client' },
        organization: { name: 'Safari Co' },
      });

      await expect(
        caller.proposals.sendToClient({ proposalId: 'p-1' }),
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });
  });

  describe('confirm', () => {
    test('sends acceptance email (public)', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', {
        id: 'p-1',
        name: 'Proposal',
        tourTitle: 'Safari Trip',
        startDate: '2024-06-01',
        pricingRows: [{ count: 2, unitPrice: 500 }],
        organization: { name: 'Safari Co', notificationEmail: 'notify@test.com' },
        client: { name: 'Client', email: 'client@test.com' },
      });
      db._results.set('select', [{ count: 5 }]);

      const result = await caller.proposals.confirm({
        proposalId: 'p-1',
        clientName: 'Client',
      });
      expect(result).toEqual({ success: true });
    });

    test('throws NOT_FOUND when proposal not found', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', undefined);
      db._results.set('select', []);

      await expect(
        caller.proposals.confirm({ proposalId: 'nonexistent', clientName: 'Client' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    test('throws BAD_REQUEST when no notification email', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', {
        id: 'p-1',
        organization: { notificationEmail: null },
        client: { name: 'Client' },
      });
      db._results.set('select', [{ count: 0 }]);

      await expect(
        caller.proposals.confirm({ proposalId: 'p-1', clientName: 'Client' }),
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });
  });
});
