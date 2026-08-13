import { describe, expect, test } from 'bun:test';
import {
  computeBookingTotal,
  formatDelta,
  formatLineAmount,
  parseSelections,
  priceAllOffers,
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
      customUnitLabel: null,
      roomCount: 2,
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
      customUnitLabel: null,
      roomCount: 2,
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

  // A hand-rolled request can repeat an id. Left alone it would price the same
  // option N times and emit N invoice line items sharing one id.
  test('deduplicates repeated ids', () => {
    const parsed = parseSelections({
      activityIds: ['a', 'a', 'b', 'a'],
      extraIds: ['x', 'x'],
    });
    expect(parsed.activityIds).toEqual(['a', 'b']);
    expect(parsed.extraIds).toEqual(['x']);
  });

  test('a repeated id cannot inflate the priced total', () => {
    const inflated = parseSelections({
      activityIds: Array(50).fill('act-balloon'),
      alternativeByDayId: {},
      extraIds: [],
    });
    // 550 per person x 4 travelers, charged once, not fifty times.
    expect(priceSelections(addOns, inflated, 4).addOnTotal).toBe(2200);
  });
});

describe('alternative price basis', () => {
  test('per_person scales with travelers, not rooms', () => {
    const s = select({ alternativeByDayId: { 'day-1': 'alt-upgrade' } });
    const { lines, addOnTotal } = priceSelections(addOns, s, 4);
    expect(addOnTotal).toBe(800); // 200 x 4 travelers
    expect(lines[0]?.detail).toBe('per person x 4');
  });

  test('per_room scales with the alternative room count, not travelers', () => {
    const perRoom: BookingAddOns = {
      ...addOns,
      alternatives: [{ ...addOns.alternatives[0]!, priceBasis: 'per_room', roomCount: 2 }],
    };
    const s = select({ alternativeByDayId: { 'day-1': 'alt-upgrade' } });
    const { lines, addOnTotal } = priceSelections(perRoom, s, 4);
    expect(addOnTotal).toBe(400); // 200 x 2 rooms
    expect(lines[0]?.detail).toBe('per room x 2');
  });

  test('flat is charged once however large the party', () => {
    const s = select({ alternativeByDayId: { 'day-2': 'alt-cheaper' } });
    expect(priceSelections(addOns, s, 8).addOnTotal).toBe(-150);
  });

  // Regression: the detail used to come from a free-text priceUnitLabel that
  // could read "Per Person" over an amount billed once.
  test('the unit shown is derived from the basis that is billed', () => {
    const s = select({ alternativeByDayId: { 'day-2': 'alt-cheaper' } });
    const { lines } = priceSelections(addOns, s, 4);
    expect(lines[0]?.detail).toBeNull();
    expect(lines[0]?.quantity).toBe(1);
  });

  test('custom is charged once, however large the party, and shows its own label', () => {
    const custom: BookingAddOns = {
      ...addOns,
      alternatives: [
        { ...addOns.alternatives[0]!, priceBasis: 'custom', customUnitLabel: 'per vehicle' },
      ],
    };
    const s = select({ alternativeByDayId: { 'day-1': 'alt-upgrade' } });
    const { lines, addOnTotal } = priceSelections(custom, s, 4);
    expect(addOnTotal).toBe(200);
    expect(lines[0]?.detail).toBe('per vehicle');
    expect(lines[0]?.quantity).toBe(1);
  });
});

describe('priceAllOffers', () => {
  test('returns a line for every offer in the catalog, regardless of selection', () => {
    const lines = priceAllOffers(addOns, 4);
    expect(lines).toHaveLength(8); // 3 activities + 2 alternatives + 3 extras
    expect(lines.map((l) => l.id)).toEqual([
      'act-balloon',
      'act-group',
      'act-unpriced',
      'alt-upgrade',
      'alt-cheaper',
      'ex-transfer',
      'ex-insurance',
      'ex-free',
    ]);
  });

  test('each line prices the same as it would via priceSelections', () => {
    const lines = priceAllOffers(addOns, 4);
    const balloon = lines.find((l) => l.id === 'act-balloon');
    expect(balloon?.amount).toBe(2200);
    const upgrade = lines.find((l) => l.id === 'alt-upgrade');
    expect(upgrade?.amount).toBe(800);
    const unpriced = lines.find((l) => l.id === 'act-unpriced');
    expect(unpriced?.onRequest).toBe(true);
  });

  test('an empty catalog returns no lines', () => {
    expect(priceAllOffers({ activities: [], alternatives: [], extras: [] }, 4)).toHaveLength(0);
  });
});

describe('formatDelta', () => {
  test('signs the amount', () => {
    expect(formatDelta(450)).toBe('+$450');
    expect(formatDelta(-200)).toBe('-$200');
    expect(formatDelta(0)).toBe('No change');
  });
});

describe('formatLineAmount', () => {
  test('a zero-cost extra reads as free, not "no change"', () => {
    const { lines } = priceSelections(addOns, select({ extraIds: ['ex-free'] }), 4);
    expect(formatLineAmount(lines[0]!)).toBe('Free');
  });

  test('a lodge swap with no delta still reads as no change', () => {
    const { lines } = priceSelections(
      { ...addOns, alternatives: [{ ...addOns.alternatives[0]!, additionalPrice: 0 }] },
      select({ alternativeByDayId: { 'day-1': 'alt-upgrade' } }),
      4,
    );
    expect(formatLineAmount(lines[0]!)).toBe('No change');
  });

  test('an unpriced activity is on request', () => {
    const { lines } = priceSelections(addOns, select({ activityIds: ['act-unpriced'] }), 4);
    expect(formatLineAmount(lines[0]!)).toBe('On request');
  });
});
