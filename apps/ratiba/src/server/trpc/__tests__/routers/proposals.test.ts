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
      db._results.set('select', [{ value: 1 }]);
      db._results.set('query.proposals.findMany', mockProposals);

      const result = await caller.proposals.listForDashboard({ filter: 'all' });
      expect(result).toMatchObject({
        items: mockProposals,
        totalCount: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });
    });

    test('returns empty paginated result when no assignments for "mine" filter', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      // No assignments found
      db._results.set('select', []);

      const result = await caller.proposals.listForDashboard({ filter: 'mine' });
      expect(result).toMatchObject({
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      });
    });

    test('returns assigned proposals for "mine" filter', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      const items = [
        { id: 'p-1', name: 'My Proposal' },
      ];
      // First select: assignment rows. Second select: count().
      db._resultsQueue.set('select', [[{ proposalId: 'p-1' }], [{ value: 1 }]]);
      db._results.set('query.proposals.findMany', items);

      const result = await caller.proposals.listForDashboard({ filter: 'mine' });
      expect(result).toMatchObject({
        items,
        totalCount: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });
    });

    test('returns pagination metadata for later pages', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      const items = [{ id: 'p-21', name: 'Proposal 21', status: 'draft' }];
      db._results.set('select', [{ value: 21 }]);
      db._results.set('query.proposals.findMany', items);

      const result = await caller.proposals.listForDashboard({
        filter: 'all',
        page: 2,
        pageSize: 20,
      });

      expect(result).toMatchObject({
        items,
        totalCount: 21,
        page: 2,
        pageSize: 20,
        totalPages: 2,
      });
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

    test('saves a proposal with no tourId (blank template)', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', undefined);
      db._results.set('tx.insert', [{ id: 'blank-prop' }]);
      db._results.set('tx.delete', { success: true });
      db._results.set('tx.select', []);

      const result = await caller.proposals.save({
        id: 'blank-prop',
        name: 'Blank Proposal',
        data: {
          tourTitle: 'Custom Safari',
          selectedTheme: 'minimalistic',
        },
      });
      expect(result.success).toBe(true);
      expect(result.id).toBe('blank-prop');
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
      expect(result).toMatchObject({ success: true });
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
      expect(result).toMatchObject({ success: true });
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
      expect(result).toMatchObject({ success: true });
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
        status: 'shared',
        pricingRows: [{ count: 2, unitPrice: 500 }],
        organization: { name: 'Safari Co', notificationEmail: 'notify@test.com' },
        client: { name: 'Client', email: 'client@test.com' },
      });
      db._results.set('select', [{ count: 5 }]);
      // confirm claims the booking with a conditional UPDATE, so the claim
      // must match a row or the mutation correctly bails with CONFLICT.
      db._results.set('update.proposals', [{ id: 'p-1' }]);

      const result = await caller.proposals.confirm({
        proposalId: 'p-1',
        clientName: 'Client',
      });
      expect(result).toMatchObject({ success: true });
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

    test('reprices from stored data and snapshots the agreed total', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', {
        id: 'p-1',
        name: 'Proposal',
        tourTitle: 'Safari Trip',
        startDate: '2024-06-01',
        status: 'shared',
        organizationId: 'org-1',
        // 4 travelers at 2500 = 10000 base
        pricingRows: [{ count: 4, unitPrice: 2500 }],
        travelerGroups: [{ count: 4 }],
        extras: [{ id: 'ex-1', name: 'Insurance', price: 45, priceUnit: 'per_person' }],
        organization: { id: 'org-1', name: 'Safari Co', notificationEmail: 'notify@test.com' },
        client: { name: 'Client', email: 'client@test.com' },
      });
      db._results.set('query.proposalDays.findMany', [
        {
          id: 'day-1',
          dayNumber: 1,
          alternatives: [
            {
              id: 'alt-1',
              accommodation: 'acc-2',
              accommodationName: 'Upgrade Lodge',
              additionalPrice: 200,
              priceBasis: 'per_person',
            },
          ],
          activities: [
            {
              id: 'act-1',
              name: 'Balloon safari',
              description: null,
              isOptional: true,
              price: '550.00',
              priceUnit: 'per_person',
            },
          ],
          accommodations: [{ id: 'pa-1', accommodation: { name: 'Serena Lodge' } }],
        },
      ]);
      db._results.set('select', [{ count: 5 }]);
      // confirm claims the booking with a conditional UPDATE, so the claim
      // must match a row or the mutation correctly bails with CONFLICT.
      db._results.set('update.proposals', [{ id: 'p-1' }]);

      const result = await caller.proposals.confirm({
        proposalId: 'p-1',
        clientName: 'Client',
        selections: {
          activityIds: ['act-1'], // 550 x 4 = 2200
          alternativeByDayId: { 'day-1': 'alt-1' }, // 200 x 4 = 800
          extraIds: ['ex-1'], // 45 x 4 = 180
        },
      });

      // 10000 + 2200 + 800 + 180
      expect(result.total).toBe(13180);

      const setCall = db._calls.find(
        (c) => c.method === 'update.set' && (c.args[0] as any)?.confirmedTotal !== undefined,
      );
      expect((setCall?.args[0] as any).confirmedTotal).toBe('13180.00');
      expect((setCall?.args[0] as any).status).toBe('awaiting_payment');
      expect((setCall?.args[0] as any).clientSelections.activityIds).toEqual(['act-1']);
    });

    test('ignores selections that do not exist on the proposal', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', {
        id: 'p-1',
        name: 'Proposal',
        status: 'shared',
        organizationId: 'org-1',
        pricingRows: [{ count: 2, unitPrice: 1000 }],
        travelerGroups: [{ count: 2 }],
        extras: [],
        organization: { id: 'org-1', name: 'Safari Co', notificationEmail: 'notify@test.com' },
        client: { name: 'Client', email: 'client@test.com' },
      });
      db._results.set('query.proposalDays.findMany', []);
      db._results.set('select', [{ count: 3 }]);
      // confirm claims the booking with a conditional UPDATE, so the claim
      // must match a row or the mutation correctly bails with CONFLICT.
      db._results.set('update.proposals', [{ id: 'p-1' }]);

      const result = await caller.proposals.confirm({
        proposalId: 'p-1',
        clientName: 'Client',
        selections: {
          activityIds: ['made-up'],
          alternativeByDayId: { 'no-such-day': 'no-such-alt' },
          extraIds: ['nope'],
        },
      });

      expect(result.total).toBe(2000);
    });

    test('rejects a second confirm once the booking is awaiting payment', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', {
        id: 'p-1',
        status: 'awaiting_payment',
        organizationId: 'org-1',
        pricingRows: [{ count: 2, unitPrice: 500 }],
        organization: { id: 'org-1', name: 'Safari Co', notificationEmail: 'notify@test.com' },
        client: { name: 'Client' },
      });
      db._results.set('select', [{ count: 3 }]);

      await expect(
        caller.proposals.confirm({ proposalId: 'p-1', clientName: 'Client' }),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    // A cancelled trip used to be confirmable: the status list was a deny-list
    // that never included it, so anyone still holding the link could flip it
    // back to awaiting_payment, re-notify the operator and mint an invoice.
    test('rejects a confirm on a cancelled proposal', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', {
        id: 'p-1',
        status: 'cancelled',
        organizationId: 'org-1',
        pricingRows: [{ count: 2, unitPrice: 500 }],
        organization: { id: 'org-1', name: 'Safari Co', notificationEmail: 'notify@test.com' },
        client: { name: 'Client' },
      });
      db._results.set('select', [{ count: 3 }]);

      await expect(
        caller.proposals.confirm({ proposalId: 'p-1', clientName: 'Client' }),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    // Two tabs, or a retried request: the pre-check can pass in both, so the
    // conditional UPDATE is what actually serializes them.
    test('rejects when the conditional claim matches no row', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', {
        id: 'p-1',
        status: 'shared',
        organizationId: 'org-1',
        pricingRows: [{ count: 2, unitPrice: 500 }],
        travelerGroups: [{ count: 2 }],
        extras: [],
        organization: { id: 'org-1', name: 'Safari Co', notificationEmail: 'notify@test.com' },
        client: { name: 'Client' },
      });
      db._results.set('query.proposalDays.findMany', []);
      db._results.set('select', [{ count: 3 }]);
      // Another request won the race between the read and the write.
      db._results.set('update.proposals', []);

      await expect(
        caller.proposals.confirm({ proposalId: 'p-1', clientName: 'Client' }),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
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
