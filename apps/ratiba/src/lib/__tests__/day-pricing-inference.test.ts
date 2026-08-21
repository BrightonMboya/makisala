import { describe, expect, test } from 'bun:test';
import { inferDayPricingFlags, type InferrableDay } from '../day-pricing-inference';

const PARK_ID = '11111111-1111-1111-1111-111111111111';

describe('inferDayPricingFlags', () => {
  test('a plain day with activities and no park destination is touring, no transit', () => {
    const days: InferrableDay[] = [
      { accommodation: 'lodge-a', destination: null, activities: [{ name: 'City tour' }] },
    ];
    expect(inferDayPricingFlags(days, 0)).toEqual({ dayKind: 'touring', isTransit: false, mealCostId: null });
  });

  test('first day with an airport transfer and no other activity is an airport transfer', () => {
    const days: InferrableDay[] = [
      {
        accommodation: 'lodge-a',
        destination: null,
        activities: [],
        transfer: { originName: 'Kilimanjaro Airport', destinationName: 'Arusha' },
      },
      { accommodation: 'lodge-a', destination: null, activities: [{ name: 'Game drive' }] },
    ];
    expect(inferDayPricingFlags(days, 0).dayKind).toBe('airport_transfer');
  });

  test('last day with a plain transfer (no airport in the name) still infers airport transfer by position', () => {
    const days: InferrableDay[] = [
      { accommodation: 'lodge-a', destination: null, activities: [{ name: 'Game drive' }] },
      {
        accommodation: null,
        destination: null,
        activities: [],
        transfer: { originName: 'Lodge', destinationName: 'Town' },
      },
    ];
    expect(inferDayPricingFlags(days, 1).dayKind).toBe('airport_transfer');
  });

  test('mid-trip transfer day between two camps (not first/last, no airport) stays touring', () => {
    const days: InferrableDay[] = [
      { accommodation: 'lodge-a', destination: null, activities: [{ name: 'Game drive' }] },
      {
        accommodation: 'lodge-b',
        destination: null,
        activities: [],
        transfer: { originName: 'Serengeti Central', destinationName: 'Serengeti North' },
      },
      { accommodation: 'lodge-b', destination: null, activities: [{ name: 'Game drive' }] },
    ];
    expect(inferDayPricingFlags(days, 1).dayKind).toBe('touring');
  });

  test('same lodge as the day before, no activities, no transfer — a rest day with no vehicle', () => {
    const days: InferrableDay[] = [
      { accommodation: 'lodge-a', destination: null, activities: [{ name: 'Arrival' }] },
      { accommodation: 'lodge-a', destination: null, activities: [] },
    ];
    expect(inferDayPricingFlags(days, 1).dayKind).toBe('none');
  });

  test('a park day with no touring activity is a transit-only pass-through', () => {
    const days: InferrableDay[] = [{ accommodation: 'lodge-a', destination: PARK_ID, activities: [] }];
    const result = inferDayPricingFlags(days, 0);
    expect(result.isTransit).toBe(true);
    expect(result.dayKind).toBe('touring');
  });

  test('a park day with a real game-drive activity is a full visit, not transit', () => {
    const days: InferrableDay[] = [
      { accommodation: 'lodge-a', destination: PARK_ID, activities: [{ name: 'Morning game drive' }] },
    ];
    expect(inferDayPricingFlags(days, 0).isTransit).toBe(false);
  });

  test('a transfer-named activity does not count as a real activity for transit/none inference', () => {
    const days: InferrableDay[] = [
      { accommodation: 'lodge-a', destination: PARK_ID, activities: [{ name: 'Transfer to camp' }] },
    ];
    expect(inferDayPricingFlags(days, 0).isTransit).toBe(true);
  });

  test('mealCostId is always null under auto-inference', () => {
    const days: InferrableDay[] = [{ accommodation: 'lodge-a', destination: null, activities: [] }];
    expect(inferDayPricingFlags(days, 0).mealCostId).toBeNull();
  });

  test('out-of-range index falls back to touring defaults instead of throwing', () => {
    expect(inferDayPricingFlags([], 0)).toEqual({ dayKind: 'touring', isTransit: false, mealCostId: null });
  });
});
