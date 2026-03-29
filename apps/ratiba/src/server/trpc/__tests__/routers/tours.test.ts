import { describe, expect, test } from 'bun:test';
import { createCallerFactory } from '../../init';
import { appRouter } from '../../router';
import { createPublicContext, createProtectedContext } from '../helpers/mock-context';

const createCaller = createCallerFactory(appRouter);

describe('tours router', () => {
  describe('list', () => {
    test('requires authentication', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(caller.tours.list()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    test('returns tours for org', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      const mockTours = [
        { id: 't-1', name: 'Safari Tour', days: 5, imageUrl: null, overview: 'Great', country: 'Tanzania', pricing: '$1000', tags: [] },
      ];
      db._results.set('select', mockTours);

      const result = await caller.tours.list();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Safari Tour');
    });
  });

  describe('getById', () => {
    test('returns tour with itinerary', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.tours.findFirst', {
        id: 't-1',
        tourName: 'Safari Tour',
        organizationId: 'org-1',
        days: [
          {
            id: 'd-1',
            dayNumber: 1,
            dayTitle: 'Arrival',
            itineraryAccommodations: [],
          },
        ],
      });

      const result = await caller.tours.getById({ id: 't-1' });
      expect(result.id).toBe('t-1');
      expect(result.days).toHaveLength(1);
    });

    test('throws NOT_FOUND for wrong org', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.tours.findFirst', {
        id: 't-1',
        organizationId: 'other-org',
      });

      await expect(caller.tours.getById({ id: 't-1' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    test('throws NOT_FOUND when tour not found', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.tours.findFirst', undefined);

      await expect(caller.tours.getById({ id: 'nonexistent' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  describe('getDetails', () => {
    test('returns formatted tour details (public)', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.tours.findFirst', {
        id: 't-1',
        pricing: '$500',
        country: 'Tanzania',
        days: [
          {
            id: 'd-1',
            dayNumber: 1,
            national_park_id: 'park-1',
            itineraryAccommodations: [
              { accommodation: { id: 'acc-1' } },
            ],
          },
        ],
      });

      const result = await caller.tours.getDetails({ id: 't-1' });
      expect(result).not.toBeNull();
      expect(result!.tourType).toBe('Private Tour');
      expect(result!.selectedTheme).toBe('minimalistic');
      expect(result!.days).toHaveLength(1);
      expect(result!.days[0].destination).toBe('park-1');
      expect(result!.days[0].accommodation).toBe('acc-1');
    });

    test('returns null when tour not found', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.tours.findFirst', undefined);

      const result = await caller.tours.getDetails({ id: 'nonexistent' });
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    test('updates tour basic fields', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.tours.findFirst', { organizationId: 'org-1' });
      db._results.set('tx.update', { success: true });

      const result = await caller.tours.update({
        id: 't-1',
        tourName: 'Updated Safari',
      });
      expect(result).toEqual({ success: true });
    });

    test('throws NOT_FOUND for wrong org', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.tours.findFirst', { organizationId: 'other-org' });

      await expect(
        caller.tours.update({ id: 't-1', tourName: 'Hack' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    test('rejects duplicate day numbers', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.tours.findFirst', { organizationId: 'org-1' });

      await expect(
        caller.tours.update({
          id: 't-1',
          itineraries: [
            { dayNumber: 1, title: 'Day 1' },
            { dayNumber: 1, title: 'Day 1 again' },
          ],
        }),
      ).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'Duplicate day numbers are not allowed' });
    });

    test('rejects non-positive day numbers', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.tours.findFirst', { organizationId: 'org-1' });

      await expect(
        caller.tours.update({
          id: 't-1',
          itineraries: [
            { dayNumber: 0, title: 'Day 0' },
          ],
        }),
      ).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'Day numbers must be positive integers' });
    });

    test('rejects non-sequential day numbers', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.tours.findFirst', { organizationId: 'org-1' });

      await expect(
        caller.tours.update({
          id: 't-1',
          itineraries: [
            { dayNumber: 1, title: 'Day 1' },
            { dayNumber: 3, title: 'Day 3' },
          ],
        }),
      ).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'Day numbers must be sequential starting from 1' });
    });

    test('updates with valid itineraries in transaction', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.tours.findFirst', { organizationId: 'org-1' });
      db._results.set('tx.update', { success: true });
      db._results.set('tx.delete', { success: true });
      db._results.set('tx.insert', [{ id: 'new-day' }]);

      const result = await caller.tours.update({
        id: 't-1',
        itineraries: [
          { dayNumber: 1, title: 'Day 1', accommodation_id: 'acc-1' },
          { dayNumber: 2, title: 'Day 2' },
        ],
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('delete', () => {
    test('deletes tour for correct org', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.tours.findFirst', { organizationId: 'org-1' });
      db._results.set('delete', { success: true });

      const result = await caller.tours.delete({ id: 't-1' });
      expect(result).toEqual({ success: true });
    });

    test('throws NOT_FOUND for wrong org', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.tours.findFirst', { organizationId: 'other-org' });

      await expect(
        caller.tours.delete({ id: 't-1' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('getToursAndClients', () => {
    test('returns tours and clients for org', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('select', [{ id: 't-1', name: 'Tour', days: 5 }]);

      const result = await caller.tours.getToursAndClients();
      expect(result.tours).toBeDefined();
      expect(result.clients).toBeDefined();
    });
  });

  describe('getSharedTemplates', () => {
    test('returns shared templates (public)', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      const mockTemplates = [
        { id: 't-1', name: 'Template 1', overview: 'Nice', days: 5, country: 'Kenya', imageUrl: null, tags: [] },
      ];
      db._results.set('select', mockTemplates);

      const result = await caller.tours.getSharedTemplates();
      expect(result).toHaveLength(1);
    });
  });

  describe('cloneTemplate', () => {
    test('clones a shared template', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.tours.findFirst', {
        id: 'template-1',
        tourName: 'Template',
        slug: 'template',
        overview: null,
        pricing: null,
        country: 'Tanzania',
        sourceUrl: null,
        activities: null,
        topFeatures: null,
        img_url: null,
        number_of_days: 3,
        tags: [],
        organizationId: null, // shared
        days: [],
      });
      db._results.set('tx.insert', [{ id: 'cloned-tour' }]);

      const result = await caller.tours.cloneTemplate({ templateId: 'template-1' });
      expect(result.success).toBe(true);
      expect(result.tourId).toBe('cloned-tour');
    });

    test('throws NOT_FOUND for missing template', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.tours.findFirst', undefined);

      await expect(
        caller.tours.cloneTemplate({ templateId: 'nonexistent' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    test('throws FORBIDDEN for template from another org', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.tours.findFirst', {
        id: 'template-1',
        organizationId: 'other-org', // not null and not ctx.orgId
        days: [],
      });

      await expect(
        caller.tours.cloneTemplate({ templateId: 'template-1' }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });
  });

  describe('getRandomDayTemplate', () => {
    test('returns a random template (public)', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('select', [
        { id: 'dt-1', dayType: 'full_day', description: 'Game drive' },
        { id: 'dt-2', dayType: 'arrival', description: 'Airport pickup' },
      ]);

      const result = await caller.tours.getRandomDayTemplate({
        nationalParkId: 'park-1',
      });
      expect(result).toBeDefined();
      expect(['dt-1', 'dt-2']).toContain(result!.id);
    });

    test('returns null when no templates exist', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('select', []);

      const result = await caller.tours.getRandomDayTemplate({
        nationalParkId: 'park-1',
      });
      expect(result).toBeNull();
    });

    test('filters by day type', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('select', [
        { id: 'dt-1', dayType: 'full_day', description: 'Game drive' },
        { id: 'dt-2', dayType: 'arrival', description: 'Airport pickup' },
      ]);

      const result = await caller.tours.getRandomDayTemplate({
        nationalParkId: 'park-1',
        dayType: 'arrival',
      });
      expect(result).toBeDefined();
      expect(result!.dayType).toBe('arrival');
    });

    test('excludes descriptions', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('select', [
        { id: 'dt-1', dayType: 'full_day', description: 'Game drive' },
        { id: 'dt-2', dayType: 'full_day', description: 'Walking safari' },
      ]);

      const result = await caller.tours.getRandomDayTemplate({
        nationalParkId: 'park-1',
        excludeDescriptions: ['Game drive'],
      });
      expect(result).toBeDefined();
      expect(result!.description).toBe('Walking safari');
    });
  });

  describe('getPageImages', () => {
    test('returns page images (public)', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('select', [
        { id: 'page-1', featured_image_url: 'https://example.com/img.jpg' },
      ]);

      const result = await caller.tours.getPageImages({ pageIds: ['page-1'] });
      expect(result).toHaveLength(1);
    });

    test('returns empty array for empty input', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      const result = await caller.tours.getPageImages({ pageIds: [] });
      expect(result).toEqual([]);
    });
  });
});
