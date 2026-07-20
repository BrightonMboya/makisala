import { describe, expect, test } from 'bun:test';
import {
  computeBookingTotal,
  formatDelta,
  parseSelections,
  priceSelections,
  EMPTY_SELECTIONS,
  type BookingAddOns,
  type Selections,
} from '../booking-addons';

const addOns: BookingAddOns = {
  activities: [
    {
      id: 'act-balloon',
      name: 'Balloon safari',
      description: null,
      dayNumber: 3,
      price: 550,
      priceUnit: 'per_person',
    },
    {
      id: 'act-group',
      name: 'Private guide',
      description: null,
      dayNumber: 2,
      price: 300,
      priceUnit: 'per_group',
    },
    {
      id: 'act-unpriced',
      name: 'Chimp trek',
      description: null,
      dayNumber: 5,
      price: null,
      priceUnit: 'per_person',
    },
  ],
  alternatives: [
    {
      id: 'alt-upgrade',
      dayId: 'day-1',
      dayNumber: 1,
      name: 'Four Seasons',
      primaryName: 'Serena Lodge',
      rooms: null,
      meals: null,
      images: [],
      additionalPrice: 200,
      priceBasis: 'per_person',
      priceUnitLabel: 'per person / per night',
    },
    {
      id: 'alt-cheaper',
      dayId: 'day-2',
      dayNumber: 2,
      name: 'Tented Camp',
      primaryName: 'Serena Lodge',
      rooms: null,
      meals: null,
      images: [],
      additionalPrice: -150,
      priceBasis: 'flat',
      priceUnitLabel: null,
    },
  ],
  extras: [
    { id: 'ex-transfer', name: 'Airport transfer', price: 80, unit: 'per_group', customUnitLabel: null },
    { id: 'ex-insurance', name: 'Insurance', price: 45, unit: 'per_person', customUnitLabel: null },
    { id: 'ex-free', name: 'Welcome drink', price: 0, unit: 'free', customUnitLabel: null },
  ],
};

const select = (s: Partial<Selections>): Selections => ({ ...EMPTY_SELECTIONS, ...s });

describe('priceSelections', () => {
  test('no selections costs nothing', () => {
    expect(priceSelections(addOns, EMPTY_SELECTIONS, 4).addOnTotal).toBe(0);
  });

  test('per-person activity multiplies by traveler count', () => {
    const { addOnTotal } = priceSelections(addOns, select({ activityIds: ['act-balloon'] }), 4);
    expect(addOnTotal).toBe(2200);
  });

  test('per-group activity is charged once regardless of travelers', () => {
    const { addOnTotal } = priceSelections(addOns, select({ activityIds: ['act-group'] }), 6);
    expect(addOnTotal).toBe(300);
  });

  test('unpriced activity adds nothing and is flagged on request', () => {
    const { lines, addOnTotal } = priceSelections(
      addOns,
      select({ activityIds: ['act-unpriced'] }),
      4,
    );
    expect(addOnTotal).toBe(0);
    expect(lines[0]?.onRequest).toBe(true);
  });

  test('per-person lodge upgrade scales with travelers', () => {
    const { addOnTotal } = priceSelections(
      addOns,
      select({ alternativeByDayId: { 'day-1': 'alt-upgrade' } }),
      3,
    );
    expect(addOnTotal).toBe(600);
  });

  test('a cheaper lodge reduces the total', () => {
    const { addOnTotal } = priceSelections(
      addOns,
      select({ alternativeByDayId: { 'day-2': 'alt-cheaper' } }),
      4,
    );
    expect(addOnTotal).toBe(-150);
  });

  test('free extras cost nothing', () => {
    expect(priceSelections(addOns, select({ extraIds: ['ex-free'] }), 4).addOnTotal).toBe(0);
  });

  test('unknown ids are ignored rather than throwing', () => {
    const { lines, addOnTotal } = priceSelections(
      addOns,
      select({ activityIds: ['does-not-exist'], alternativeByDayId: { 'day-9': 'nope' } }),
      4,
    );
    expect(lines).toHaveLength(0);
    expect(addOnTotal).toBe(0);
  });

  test('an alternative id belonging to another day is not applied', () => {
    // Guards against a client posting a cheap day-2 lodge under day-1's key.
    const { addOnTotal } = priceSelections(
      addOns,
      select({ alternativeByDayId: { 'day-1': 'alt-cheaper' } }),
      4,
    );
    expect(addOnTotal).toBe(0);
  });

  test('at most one lodge per night can be selected', () => {
    const s = select({ alternativeByDayId: { 'day-1': 'alt-upgrade', 'day-2': 'alt-cheaper' } });
    const { lines } = priceSelections(addOns, s, 2);
    expect(lines.filter((l) => l.kind === 'alternative')).toHaveLength(2);
  });

  test('zero travelers still charges per-person items once', () => {
    expect(priceSelections(addOns, select({ activityIds: ['act-balloon'] }), 0).addOnTotal).toBe(550);
  });
});

describe('computeBookingTotal', () => {
  test('sums base and a mixed basket', () => {
    const s = select({
      activityIds: ['act-balloon', 'act-group'], // 550*4 + 300 = 2500
      alternativeByDayId: { 'day-1': 'alt-upgrade', 'day-2': 'alt-cheaper' }, // 200*4 - 150 = 650
      extraIds: ['ex-transfer', 'ex-insurance'], // 80 + 45*4 = 260
    });
    const { total, addOnTotal } = computeBookingTotal(10_000, addOns, s, 4);
    expect(addOnTotal).toBe(3410);
    expect(total).toBe(13_410);
  });

  test('base total is unchanged when nothing is picked', () => {
    expect(computeBookingTotal(10_000, addOns, EMPTY_SELECTIONS, 4).total).toBe(10_000);
  });
});

describe('parseSelections', () => {
  test('null becomes empty selections', () => {
    expect(parseSelections(null)).toEqual(EMPTY_SELECTIONS);
  });

  test('drops non-string entries from stored json', () => {
    const parsed = parseSelections({
      activityIds: ['a', 42, null],
      alternativeByDayId: { 'day-1': 'alt-1', 'day-2': 7 },
      extraIds: 'not-an-array',
    });
    expect(parsed.activityIds).toEqual(['a']);
    expect(parsed.alternativeByDayId).toEqual({ 'day-1': 'alt-1' });
    expect(parsed.extraIds).toEqual([]);
  });
});

describe('formatDelta', () => {
  test('signs the amount', () => {
    expect(formatDelta(450)).toBe('+$450');
    expect(formatDelta(-200)).toBe('-$200');
    expect(formatDelta(0)).toBe('No change');
  });
});
