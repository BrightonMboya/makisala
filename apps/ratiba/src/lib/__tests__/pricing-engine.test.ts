import { describe, expect, test } from 'bun:test';
import {
  computePricing,
  deriveMealPlan,
  occupantSlotCost,
  resolveSeason,
  type AccommodationRate,
  type ActivityRate,
  type ParkAncillaryFeeRate,
  type ParkFeeRate,
  type PricingInput,
  type SeasonBand,
  type TransferRate,
  type VehicleRate,
} from '@/lib/pricing-engine';

// Pure functions, no DB/network involved — these tests never touch a
// database, mocked or otherwise.

// ---------------------------------------------------------------------------
// deriveMealPlan
// ---------------------------------------------------------------------------

describe('deriveMealPlan', () => {
  test('undefined input returns null', () => {
    expect(deriveMealPlan(undefined)).toBeNull();
  });

  test('no meals set returns room-only', () => {
    expect(deriveMealPlan({ breakfast: false, lunch: false, dinner: false })).toBe('ro');
  });

  test('all falsy/missing fields returns room-only', () => {
    expect(deriveMealPlan({})).toBe('ro');
  });

  test('null fields behave like false', () => {
    expect(deriveMealPlan({ breakfast: null, lunch: null, dinner: null })).toBe('ro');
  });

  test('breakfast only returns bed & breakfast', () => {
    expect(deriveMealPlan({ breakfast: true, lunch: false, dinner: false })).toBe('bb');
  });

  test('all three meals returns full board', () => {
    expect(deriveMealPlan({ breakfast: true, lunch: true, dinner: true })).toBe('fb');
  });

  test('breakfast + lunch returns half board', () => {
    expect(deriveMealPlan({ breakfast: true, lunch: true, dinner: false })).toBe('hb');
  });

  test('breakfast + dinner returns half board', () => {
    expect(deriveMealPlan({ breakfast: true, lunch: false, dinner: true })).toBe('hb');
  });

  test('lunch only (no breakfast) still returns half board, not room-only', () => {
    // Quirk of the current rule set: any single non-breakfast meal, or any
    // partial combo without breakfast, falls through to 'hb'. Locked in here
    // so a future refactor doesn't silently change this to 'ro' or a crash.
    expect(deriveMealPlan({ breakfast: false, lunch: true, dinner: false })).toBe('hb');
  });

  test('dinner only (no breakfast) returns half board', () => {
    expect(deriveMealPlan({ breakfast: false, lunch: false, dinner: true })).toBe('hb');
  });

  test('lunch + dinner (no breakfast) returns half board', () => {
    expect(deriveMealPlan({ breakfast: false, lunch: true, dinner: true })).toBe('hb');
  });
});

// ---------------------------------------------------------------------------
// occupantSlotCost
// ---------------------------------------------------------------------------

describe('occupantSlotCost', () => {
  const flatRate = { perPaxRate: 100, additionalAdultPct: null, additionalChildPct: null };

  test('no % configured reduces to perPaxRate * pax (legacy flat-multiply)', () => {
    expect(occupantSlotCost(flatRate, 4, 0)).toBe(400);
  });

  test('zero pax costs nothing', () => {
    expect(occupantSlotCost(flatRate, 0, 0)).toBe(0);
  });

  test('1st and 2nd adults always at 100%, no discount pct configured', () => {
    expect(occupantSlotCost(flatRate, 2, 0)).toBe(200);
  });

  test('3rd+ adult uses additionalAdultPct', () => {
    const rate = { perPaxRate: 100, additionalAdultPct: 50, additionalChildPct: null };
    // 1st + 2nd at 100 each, 3rd at 50% = 50
    expect(occupantSlotCost(rate, 3, 0)).toBe(250);
  });

  test('additionalAdultPct of 0 makes extra adults free (not defaulted to 100%)', () => {
    const rate = { perPaxRate: 100, additionalAdultPct: 0, additionalChildPct: null };
    expect(occupantSlotCost(rate, 3, 0)).toBe(200);
  });

  test('children priced via additionalChildPct regardless of adult count', () => {
    const rate = { perPaxRate: 100, additionalAdultPct: null, additionalChildPct: 50 };
    // 2 adults @ 100 + 1 child @ 50% of 100
    expect(occupantSlotCost(rate, 3, 1)).toBe(250);
  });

  test('no additionalChildPct configured defaults child to 100%', () => {
    expect(occupantSlotCost(flatRate, 3, 1)).toBe(300);
  });

  test('children count exceeding pax clamps adults to zero, never negative', () => {
    const rate = { perPaxRate: 100, additionalAdultPct: null, additionalChildPct: 50 };
    // children=5 > pax=2: adults = max(0, 2-5) = 0, children still charged at 5
    expect(occupantSlotCost(rate, 2, 5)).toBe(250);
  });

  test('negative children input is clamped to zero', () => {
    expect(occupantSlotCost(flatRate, 3, -2)).toBe(300);
  });

  test('all children, zero adults', () => {
    const rate = { perPaxRate: 100, additionalAdultPct: null, additionalChildPct: 50 };
    expect(occupantSlotCost(rate, 2, 2)).toBe(100);
  });

  test('single adult (below the 1st/2nd baseline) is full price', () => {
    const rate = { perPaxRate: 100, additionalAdultPct: 10, additionalChildPct: null };
    expect(occupantSlotCost(rate, 1, 0)).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// resolveSeason
// ---------------------------------------------------------------------------

describe('resolveSeason', () => {
  const highSeason: SeasonBand = {
    id: 'high',
    name: 'High season',
    startMonth: 6,
    startDay: 1,
    endMonth: 9,
    endDay: 30,
    priority: 1,
  };
  const lowSeason: SeasonBand = {
    id: 'low',
    name: 'Low season',
    startMonth: 1,
    startDay: 1,
    endMonth: 12,
    endDay: 31,
    priority: 0,
  };
  const festiveWrap: SeasonBand = {
    id: 'festive',
    name: 'Festive',
    startMonth: 12,
    startDay: 20,
    endMonth: 1,
    endDay: 5,
    priority: 2,
  };

  test('no seasons configured returns null', () => {
    expect(resolveSeason(new Date(Date.UTC(2026, 6, 1)), [])).toBeNull();
  });

  test('date with no matching band returns null', () => {
    const narrow: SeasonBand = { id: 'x', name: 'X', startMonth: 3, startDay: 1, endMonth: 3, endDay: 10, priority: 0 };
    expect(resolveSeason(new Date(Date.UTC(2026, 6, 1)), [narrow])).toBeNull();
  });

  test('simple non-wrapping match', () => {
    const season = resolveSeason(new Date(Date.UTC(2026, 6, 15)), [highSeason, lowSeason]);
    expect(season?.id).toBe('high');
  });

  test('higher priority wins on overlap', () => {
    // Aug 1 falls inside both high (Jun-Sep) and low (Jan-Dec); high has priority 1 > 0.
    const season = resolveSeason(new Date(Date.UTC(2026, 7, 1)), [lowSeason, highSeason]);
    expect(season?.id).toBe('high');
  });

  test('band boundaries are inclusive on both ends', () => {
    const start = resolveSeason(new Date(Date.UTC(2026, 5, 1)), [highSeason]); // Jun 1
    const end = resolveSeason(new Date(Date.UTC(2026, 8, 30)), [highSeason]); // Sep 30
    expect(start?.id).toBe('high');
    expect(end?.id).toBe('high');
  });

  test('one day outside the boundary does not match', () => {
    const beforeStart = resolveSeason(new Date(Date.UTC(2026, 4, 31)), [highSeason]); // May 31
    const afterEnd = resolveSeason(new Date(Date.UTC(2026, 9, 1)), [highSeason]); // Oct 1
    expect(beforeStart).toBeNull();
    expect(afterEnd).toBeNull();
  });

  test('year-wrapping band matches on the December side', () => {
    const season = resolveSeason(new Date(Date.UTC(2026, 11, 25)), [festiveWrap]); // Dec 25
    expect(season?.id).toBe('festive');
  });

  test('year-wrapping band matches on the January side', () => {
    const season = resolveSeason(new Date(Date.UTC(2026, 0, 2)), [festiveWrap]); // Jan 2
    expect(season?.id).toBe('festive');
  });

  test('year-wrapping band does not match mid-year dates', () => {
    const season = resolveSeason(new Date(Date.UTC(2026, 5, 15)), [festiveWrap]); // Jun 15
    expect(season).toBeNull();
  });

  test('wrapping band beats a lower-priority year-round band at the year boundary', () => {
    const season = resolveSeason(new Date(Date.UTC(2026, 11, 31)), [lowSeason, festiveWrap]);
    expect(season?.id).toBe('festive');
  });

  test('uses UTC date components, not local time', () => {
    // A date built from UTC components should resolve using those UTC month/day,
    // regardless of the machine's local timezone.
    const d = new Date(Date.UTC(2026, 6, 4, 23, 59));
    const season = resolveSeason(d, [highSeason]);
    expect(season?.id).toBe('high');
  });

  test('tie in priority resolves to one of the matches deterministically (first wins reduce)', () => {
    const tieA: SeasonBand = { ...highSeason, id: 'tie-a', priority: 1 };
    const tieB: SeasonBand = { ...highSeason, id: 'tie-b', priority: 1 };
    const season = resolveSeason(new Date(Date.UTC(2026, 6, 1)), [tieA, tieB]);
    expect(season?.id).toBe('tie-a');
  });
});

// ---------------------------------------------------------------------------
// computePricing
// ---------------------------------------------------------------------------

function baseInput(overrides: Partial<PricingInput> = {}): PricingInput {
  return {
    days: [],
    pax: 2,
    travelerCategory: 'non_resident_adult',
    vehicleId: null,
    vehicleCount: 1,
    pickupTransferId: null,
    dropoffTransferId: null,
    markupPct: 20,
    currency: 'USD',
    seasons: [],
    accommodationRates: [],
    parkFeeRates: [],
    parkAncillaryFees: [],
    vehicles: [],
    transferRates: [],
    activityRates: [],
    ...overrides,
  };
}

const yearRoundSeason: SeasonBand = {
  id: 'season-1',
  name: 'Year round',
  startMonth: 1,
  startDay: 1,
  endMonth: 12,
  endDay: 31,
  priority: 0,
};

describe('computePricing — accommodation', () => {
  test('empty input produces zero totals and no line items', () => {
    const result = computePricing(baseInput({ pax: 0 }));
    expect(result.lineItems).toEqual([]);
    expect(result.costSubtotal).toBe(0);
    expect(result.sellTotal).toBe(0);
    expect(result.costPerPax).toBe(0);
    expect(result.sellPerPax).toBe(0);
    expect(result.warnings).toEqual([]);
  });

  test('per_person rate with no room mix set reduces to perPaxRate * pax', () => {
    const rate: AccommodationRate = {
      accommodationId: 'acc-1',
      seasonId: 'season-1',
      roomType: 'double',
      mealPlan: 'bb',
      perPaxRate: 150,
      rateBasis: 'per_person',
      maxOccupancy: 2,
      additionalAdultPct: null,
      additionalChildPct: null,
    };
    const result = computePricing(
      baseInput({
        seasons: [yearRoundSeason],
        accommodationRates: [rate],
        days: [
          {
            dayNumber: 1,
            date: new Date(Date.UTC(2026, 6, 1)),
            accommodationId: 'acc-1',
            accommodationName: 'Test Lodge',
            mealPlan: 'bb',
            rooms: [{ roomType: 'double', pax: 2 }],
            parkId: null,
          },
        ],
      }),
    );
    expect(result.warnings).toEqual([]);
    expect(result.lineItems).toHaveLength(1);
    expect(result.lineItems[0]).toMatchObject({ quantity: 2, unitCost: 150, totalCost: 300, source: 'accommodation' });
  });

  test('missing meal plan or empty room mix skips the day with a warning', () => {
    const result = computePricing(
      baseInput({
        seasons: [yearRoundSeason],
        days: [
          {
            dayNumber: 1,
            date: new Date(Date.UTC(2026, 6, 1)),
            accommodationId: 'acc-1',
            mealPlan: null,
            rooms: [],
            parkId: null,
          },
        ],
      }),
    );
    expect(result.lineItems).toEqual([]);
    expect(result.warnings).toMatchObject([{ kind: 'missing_room_meal', dayNumber: 1 }]);
  });

  test('room with zero pax is filtered out and still triggers missing_room_meal', () => {
    const result = computePricing(
      baseInput({
        seasons: [yearRoundSeason],
        days: [
          {
            dayNumber: 1,
            date: new Date(Date.UTC(2026, 6, 1)),
            accommodationId: 'acc-1',
            mealPlan: 'bb',
            rooms: [{ roomType: 'double', pax: 0 }],
            parkId: null,
          },
        ],
      }),
    );
    expect(result.warnings[0]?.kind).toBe('missing_room_meal');
  });

  test('no season match warns and skips the hotel line entirely (not a $0 line)', () => {
    const result = computePricing(
      baseInput({
        seasons: [],
        days: [
          {
            dayNumber: 1,
            date: new Date(Date.UTC(2026, 6, 1)),
            accommodationId: 'acc-1',
            mealPlan: 'bb',
            rooms: [{ roomType: 'double', pax: 2 }],
            parkId: null,
          },
        ],
      }),
    );
    expect(result.lineItems).toEqual([]);
    expect(result.warnings).toMatchObject([{ kind: 'no_season', dayNumber: 1 }]);
  });

  test('missing hotel rate for the resolved season produces a $0 line plus warning (not skipped)', () => {
    const result = computePricing(
      baseInput({
        seasons: [yearRoundSeason],
        accommodationRates: [],
        days: [
          {
            dayNumber: 1,
            date: new Date(Date.UTC(2026, 6, 1)),
            accommodationId: 'acc-1',
            accommodationName: 'Test Lodge',
            mealPlan: 'bb',
            rooms: [{ roomType: 'double', pax: 2 }],
            parkId: null,
          },
        ],
      }),
    );
    expect(result.lineItems).toHaveLength(1);
    expect(result.lineItems[0]).toMatchObject({ unitCost: 0, totalCost: 0, missing: 'rate not configured' });
    expect(result.warnings).toMatchObject([{ kind: 'missing_hotel_rate', dayNumber: 1 }]);
  });

  test('per_room basis divides pax across rooms with ceiling, using stated capacity', () => {
    const rate: AccommodationRate = {
      accommodationId: 'acc-1',
      seasonId: 'season-1',
      roomType: 'family',
      mealPlan: 'bb',
      perPaxRate: 400, // flat per-room price
      rateBasis: 'per_room',
      maxOccupancy: 2,
      additionalAdultPct: null,
      additionalChildPct: null,
    };
    // 5 pax at capacity 2 -> ceil(5/2) = 3 rooms
    const result = computePricing(
      baseInput({
        pax: 5,
        seasons: [yearRoundSeason],
        accommodationRates: [rate],
        days: [
          {
            dayNumber: 1,
            date: new Date(Date.UTC(2026, 6, 1)),
            accommodationId: 'acc-1',
            mealPlan: 'bb',
            rooms: [{ roomType: 'family', pax: 5 }],
            parkId: null,
          },
        ],
      }),
    );
    expect(result.lineItems[0]).toMatchObject({ quantity: 3, unitCost: 400, totalCost: 1200 });
  });

  test('per_room basis with no maxOccupancy warns and charges exactly 1 room', () => {
    const rate: AccommodationRate = {
      accommodationId: 'acc-1',
      seasonId: 'season-1',
      roomType: 'family',
      mealPlan: 'bb',
      perPaxRate: 400,
      rateBasis: 'per_room',
      maxOccupancy: null,
      additionalAdultPct: null,
      additionalChildPct: null,
    };
    const result = computePricing(
      baseInput({
        pax: 6,
        seasons: [yearRoundSeason],
        accommodationRates: [rate],
        days: [
          {
            dayNumber: 1,
            date: new Date(Date.UTC(2026, 6, 1)),
            accommodationId: 'acc-1',
            mealPlan: 'bb',
            rooms: [{ roomType: 'family', pax: 6 }],
            parkId: null,
          },
        ],
      }),
    );
    expect(result.lineItems[0]).toMatchObject({ quantity: 1, totalCost: 400 });
    expect(result.warnings.some((w) => w.kind === 'missing_room_capacity')).toBe(true);
  });

  test('per_person basis applies occupant-slot discounts (children) into the line total', () => {
    const rate: AccommodationRate = {
      accommodationId: 'acc-1',
      seasonId: 'season-1',
      roomType: 'family',
      mealPlan: 'bb',
      perPaxRate: 100,
      rateBasis: 'per_person',
      maxOccupancy: 4,
      additionalAdultPct: null,
      additionalChildPct: 50,
    };
    const result = computePricing(
      baseInput({
        pax: 3,
        seasons: [yearRoundSeason],
        accommodationRates: [rate],
        days: [
          {
            dayNumber: 1,
            date: new Date(Date.UTC(2026, 6, 1)),
            accommodationId: 'acc-1',
            mealPlan: 'bb',
            rooms: [{ roomType: 'family', pax: 3, children: 1 }],
            parkId: null,
          },
        ],
      }),
    );
    // 2 adults @ 100 + 1 child @ 50 = 250; unitCost is derived back as
    // totalCost/pax, rounded to 2dp same as every other money value (num()).
    expect(result.lineItems[0]?.totalCost).toBe(250);
    expect(result.lineItems[0]?.unitCost).toBe(83.33);
    expect(result.lineItems[0]?.occupantBreakdown).toBe('2 adults + 1 child @ 50%');
  });

  test('occupantBreakdown is undefined for a flat perPaxRate * pax line (2 adults, no children)', () => {
    const rate: AccommodationRate = {
      accommodationId: 'acc-1',
      seasonId: 'season-1',
      roomType: 'double',
      mealPlan: 'bb',
      perPaxRate: 100,
      rateBasis: 'per_person',
      maxOccupancy: 2,
      additionalAdultPct: null,
      additionalChildPct: null,
    };
    const result = computePricing(
      baseInput({
        pax: 2,
        seasons: [yearRoundSeason],
        accommodationRates: [rate],
        days: [
          {
            dayNumber: 1,
            date: new Date(Date.UTC(2026, 6, 1)),
            accommodationId: 'acc-1',
            mealPlan: 'bb',
            rooms: [{ roomType: 'double', pax: 2 }],
            parkId: null,
          },
        ],
      }),
    );
    expect(result.lineItems[0]?.occupantBreakdown).toBeUndefined();
  });

  test('occupantBreakdown describes extra adults beyond the 1st/2nd', () => {
    const rate: AccommodationRate = {
      accommodationId: 'acc-1',
      seasonId: 'season-1',
      roomType: 'family',
      mealPlan: 'bb',
      perPaxRate: 100,
      rateBasis: 'per_person',
      maxOccupancy: 4,
      additionalAdultPct: 70,
      additionalChildPct: null,
    };
    const result = computePricing(
      baseInput({
        pax: 4,
        seasons: [yearRoundSeason],
        accommodationRates: [rate],
        days: [
          {
            dayNumber: 1,
            date: new Date(Date.UTC(2026, 6, 1)),
            accommodationId: 'acc-1',
            mealPlan: 'bb',
            rooms: [{ roomType: 'family', pax: 4 }],
            parkId: null,
          },
        ],
      }),
    );
    expect(result.lineItems[0]?.occupantBreakdown).toBe('2 adults + 2 extra adults @ 70%');
  });

  test('room mix not covering every traveler emits room_pax_mismatch but still prices what is there', () => {
    const rate: AccommodationRate = {
      accommodationId: 'acc-1',
      seasonId: 'season-1',
      roomType: 'double',
      mealPlan: 'bb',
      perPaxRate: 100,
      rateBasis: 'per_person',
      maxOccupancy: 2,
      additionalAdultPct: null,
      additionalChildPct: null,
    };
    const result = computePricing(
      baseInput({
        pax: 4,
        seasons: [yearRoundSeason],
        accommodationRates: [rate],
        days: [
          {
            dayNumber: 1,
            date: new Date(Date.UTC(2026, 6, 1)),
            accommodationId: 'acc-1',
            mealPlan: 'bb',
            rooms: [{ roomType: 'double', pax: 2 }], // only 2 of 4 pax housed
            parkId: null,
          },
        ],
      }),
    );
    expect(result.lineItems[0]?.totalCost).toBe(200);
    expect(result.warnings).toMatchObject([{ kind: 'room_pax_mismatch', dayNumber: 1 }]);
  });

  test('multiple room types on the same day each get their own line and unique key', () => {
    const rates: AccommodationRate[] = [
      {
        accommodationId: 'acc-1',
        seasonId: 'season-1',
        roomType: 'double',
        mealPlan: 'bb',
        perPaxRate: 100,
        rateBasis: 'per_person',
        maxOccupancy: 2,
        additionalAdultPct: null,
        additionalChildPct: null,
      },
      {
        accommodationId: 'acc-1',
        seasonId: 'season-1',
        roomType: 'single',
        mealPlan: 'bb',
        perPaxRate: 130,
        rateBasis: 'per_person',
        maxOccupancy: 1,
        additionalAdultPct: null,
        additionalChildPct: null,
      },
    ];
    const result = computePricing(
      baseInput({
        pax: 3,
        seasons: [yearRoundSeason],
        accommodationRates: rates,
        days: [
          {
            dayNumber: 1,
            date: new Date(Date.UTC(2026, 6, 1)),
            accommodationId: 'acc-1',
            mealPlan: 'bb',
            rooms: [
              { roomType: 'double', pax: 2 },
              { roomType: 'single', pax: 1 },
            ],
            parkId: null,
          },
        ],
      }),
    );
    expect(result.lineItems).toHaveLength(2);
    const keys = result.lineItems.map((l) => l.key);
    expect(new Set(keys).size).toBe(2);
    expect(result.costSubtotal).toBe(200 + 130);
  });

  test('season resolution is scoped to the accommodation\'s own season ids, not global priority', () => {
    // A broad org-wide "High" season with higher priority should NOT win over
    // this hotel's own narrower season if the hotel has no rate under "High".
    const broadHigh: SeasonBand = { id: 'broad-high', name: 'High', startMonth: 1, startDay: 1, endMonth: 12, endDay: 31, priority: 5 };
    const narrowOwn: SeasonBand = { id: 'own-season', name: 'Own', startMonth: 6, startDay: 1, endMonth: 9, endDay: 30, priority: 1 };
    const rate: AccommodationRate = {
      accommodationId: 'acc-1',
      seasonId: 'own-season',
      roomType: 'double',
      mealPlan: 'bb',
      perPaxRate: 100,
      rateBasis: 'per_person',
      maxOccupancy: 2,
      additionalAdultPct: null,
      additionalChildPct: null,
    };
    const result = computePricing(
      baseInput({
        pax: 2,
        seasons: [broadHigh, narrowOwn],
        accommodationRates: [rate],
        days: [
          {
            dayNumber: 1,
            date: new Date(Date.UTC(2026, 6, 15)),
            accommodationId: 'acc-1',
            mealPlan: 'bb',
            rooms: [{ roomType: 'double', pax: 2 }],
            parkId: null,
          },
        ],
      }),
    );
    expect(result.warnings).toEqual([]);
    expect(result.lineItems[0]?.totalCost).toBe(200);
  });
});

describe('computePricing — park fees', () => {
  const parkRate: ParkFeeRate = {
    parkId: 'park-1',
    parkName: 'Serengeti National Park',
    seasonId: null,
    category: 'non_resident_adult',
    perPersonRate: 60,
  };

  test('single traveler category, no breakdown: prices the whole pax as one segment', () => {
    const result = computePricing(
      baseInput({
        pax: 4,
        travelerCategory: 'non_resident_adult',
        parkFeeRates: [parkRate],
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: 'park-1' }],
      }),
    );
    expect(result.lineItems).toHaveLength(1);
    expect(result.lineItems[0]).toMatchObject({ quantity: 4, unitCost: 60, totalCost: 240, source: 'park_fee' });
    expect(result.lineItems[0]?.label).not.toContain('Adults'); // showCategory false with a single segment
  });

  test('traveler breakdown with multiple non-zero segments shows the category in the label', () => {
    const childRate: ParkFeeRate = { ...parkRate, category: 'non_resident_child', perPersonRate: 30 };
    const result = computePricing(
      baseInput({
        pax: 4,
        travelerBreakdown: [
          { category: 'non_resident_adult', count: 2 },
          { category: 'non_resident_child', count: 2 },
        ],
        parkFeeRates: [parkRate, childRate],
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: 'park-1' }],
      }),
    );
    expect(result.lineItems).toHaveLength(2);
    expect(result.lineItems.every((l) => l.label.includes('Adults') || l.label.includes('Children'))).toBe(true);
    expect(result.costSubtotal).toBe(120 + 60);
  });

  test('breakdown segments with zero count are skipped and do not force a category label', () => {
    const result = computePricing(
      baseInput({
        pax: 4,
        travelerBreakdown: [
          { category: 'non_resident_adult', count: 4 },
          { category: 'non_resident_child', count: 0 },
        ],
        parkFeeRates: [parkRate],
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: 'park-1' }],
      }),
    );
    expect(result.lineItems).toHaveLength(1);
    expect(result.lineItems[0]?.label).not.toContain('Adults');
  });

  test('missing rate for a segment category warns and adds no line for that segment', () => {
    const result = computePricing(
      baseInput({
        pax: 2,
        travelerCategory: 'citizen_adult', // no rate configured for this category
        parkFeeRates: [parkRate],
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: 'park-1' }],
      }),
    );
    expect(result.lineItems).toEqual([]);
    expect(result.warnings).toMatchObject([{ kind: 'missing_park_fee', dayNumber: 1 }]);
  });

  test('season-specific rate is preferred over the season-less fallback', () => {
    const seasonRate: ParkFeeRate = { ...parkRate, seasonId: 'season-1', perPersonRate: 80 };
    const result = computePricing(
      baseInput({
        pax: 1,
        seasons: [yearRoundSeason],
        parkFeeRates: [parkRate, seasonRate],
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: 'park-1' }],
      }),
    );
    expect(result.lineItems[0]?.unitCost).toBe(80);
  });

  test('falls back to season-less rate when no seasonal rate matches', () => {
    const result = computePricing(
      baseInput({
        pax: 1,
        seasons: [yearRoundSeason],
        parkFeeRates: [parkRate], // seasonId: null only
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: 'park-1' }],
      }),
    );
    expect(result.lineItems[0]?.unitCost).toBe(60);
  });

  test('resolves park by destination name when parkId is null, stripping the "National Park" suffix', () => {
    const result = computePricing(
      baseInput({
        pax: 2,
        parkFeeRates: [parkRate],
        days: [
          {
            dayNumber: 1,
            date: new Date(Date.UTC(2026, 6, 1)),
            accommodationId: null,
            mealPlan: null,
            rooms: [],
            parkId: null,
            destinationName: 'Serengeti National Park',
          },
        ],
      }),
    );
    expect(result.lineItems).toHaveLength(1);
    expect(result.lineItems[0]?.totalCost).toBe(120);
  });

  test('a plain city day (no "national park"/"conservation area" wording) never resolves to a park fee', () => {
    // Guards against the Arusha-city vs Arusha-National-Park collision the
    // normalizeParkName suffix-stripping would otherwise cause.
    const arushaCityRate: ParkFeeRate = { ...parkRate, parkId: 'arusha-np', parkName: 'Arusha National Park' };
    const result = computePricing(
      baseInput({
        pax: 2,
        parkFeeRates: [arushaCityRate],
        days: [
          {
            dayNumber: 1,
            date: new Date(Date.UTC(2026, 6, 1)),
            accommodationId: null,
            mealPlan: null,
            rooms: [],
            parkId: null,
            destinationName: 'Arusha',
          },
        ],
      }),
    );
    expect(result.lineItems).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  test('a destination-resolved park with no configured rate anywhere is not treated as fee-bearing (no warning either)', () => {
    const result = computePricing(
      baseInput({
        pax: 2,
        parkFeeRates: [],
        parkAncillaryFees: [],
        days: [
          {
            dayNumber: 1,
            date: new Date(Date.UTC(2026, 6, 1)),
            accommodationId: null,
            mealPlan: null,
            rooms: [],
            parkId: null,
            destinationName: 'Nowhere National Park',
          },
        ],
      }),
    );
    expect(result.lineItems).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});

describe('computePricing — park ancillary fees', () => {
  const ancillaryPerDay: ParkAncillaryFeeRate = {
    parkId: 'park-1',
    parkName: 'Ngorongoro Conservation Area',
    seasonId: null,
    name: 'Crater descent fee',
    chargeBasis: 'per_vehicle_per_day',
    rate: 200,
  };
  const ancillaryOnce: ParkAncillaryFeeRate = {
    parkId: 'park-1',
    parkName: 'Ngorongoro Conservation Area',
    seasonId: null,
    name: 'Vehicle entry fee',
    chargeBasis: 'per_vehicle_once_per_visit',
    rate: 50,
  };

  const twoDaysAtPark = [
    { dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: 'park-1' },
    { dayNumber: 2, date: new Date(Date.UTC(2026, 6, 2)), accommodationId: null, mealPlan: null, rooms: [], parkId: 'park-1' },
  ];

  test('per_vehicle_per_day multiplies by the number of days spent at the park', () => {
    const result = computePricing(
      baseInput({ pax: 2, vehicleId: 'veh-1', vehicles: [{ id: 'veh-1', perDayRate: 100 }], parkAncillaryFees: [ancillaryPerDay], days: twoDaysAtPark }),
    );
    const line = result.lineItems.find((l) => l.key.includes('Crater descent'));
    expect(line?.totalCost).toBe(400); // 200 * 2 days * 1 vehicle
  });

  test('per_vehicle_once_per_visit charges exactly once regardless of day count', () => {
    const result = computePricing(
      baseInput({ pax: 2, vehicleId: 'veh-1', vehicles: [{ id: 'veh-1', perDayRate: 100 }], parkAncillaryFees: [ancillaryOnce], days: twoDaysAtPark }),
    );
    const line = result.lineItems.find((l) => l.key.includes('Vehicle entry'));
    expect(line?.totalCost).toBe(50);
  });

  test('vehicleCount > 1 multiplies both per-day and once-per-visit ancillary fees', () => {
    const result = computePricing(
      baseInput({
        pax: 6,
        vehicleId: 'veh-1',
        vehicleCount: 2,
        vehicles: [{ id: 'veh-1', perDayRate: 100 }],
        parkAncillaryFees: [ancillaryPerDay, ancillaryOnce],
        days: twoDaysAtPark,
      }),
    );
    const perDay = result.lineItems.find((l) => l.key.includes('Crater descent'));
    const once = result.lineItems.find((l) => l.key.includes('Vehicle entry'));
    expect(perDay?.totalCost).toBe(800); // 200 * 2 days * 2 vehicles
    expect(once?.totalCost).toBe(100); // 50 * 1 * 2 vehicles
  });

  test('no vehicle selected skips ancillary fees entirely with a dedicated warning', () => {
    const result = computePricing(
      baseInput({ pax: 2, vehicleId: null, parkAncillaryFees: [ancillaryPerDay], days: twoDaysAtPark }),
    );
    expect(result.lineItems.some((l) => l.key.startsWith('park_ancillary'))).toBe(false);
    expect(result.warnings.some((w) => w.kind === 'missing_park_ancillary_no_vehicle')).toBe(true);
  });

  test('a park with only an ancillary fee configured (no parkFeeRates at all) never warns "no park fee"', () => {
    // Regression: an ancillary-only sub-feature (e.g. "Ngorongoro Crater" with
    // just a crater-descent fee) used to still run the entrance-fee loop and
    // warn "no park fee for category X" on every day, even though the park was
    // never meant to charge an entrance fee at all.
    const result = computePricing(
      baseInput({
        pax: 2,
        vehicleId: 'veh-1',
        vehicles: [{ id: 'veh-1', perDayRate: 100 }],
        parkAncillaryFees: [ancillaryPerDay], // parkFeeRates stays empty
        days: twoDaysAtPark,
      }),
    );
    expect(result.warnings.some((w) => w.kind === 'missing_park_fee')).toBe(false);
  });

  test('per_vehicle_once_per_visit charges once per contiguous visit, not once for the whole trip', () => {
    // A park re-entered later in the itinerary after a day elsewhere (e.g. a
    // loop: Tarangire -> Ngorongoro -> Tarangire again) is two separate
    // visits, so a gate fee charges twice.
    const loopDays = [
      { dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: 'park-1' },
      { dayNumber: 2, date: new Date(Date.UTC(2026, 6, 2)), accommodationId: null, mealPlan: null, rooms: [], parkId: 'other-park' },
      { dayNumber: 3, date: new Date(Date.UTC(2026, 6, 3)), accommodationId: null, mealPlan: null, rooms: [], parkId: 'park-1' },
    ];
    const result = computePricing(
      baseInput({
        pax: 2,
        vehicleId: 'veh-1',
        vehicles: [{ id: 'veh-1', perDayRate: 100 }],
        parkAncillaryFees: [ancillaryOnce],
        days: loopDays,
      }),
    );
    const once = result.lineItems.find((l) => l.key.includes('Vehicle entry'));
    expect(once?.totalCost).toBe(100); // 2 visits * $50
    expect(once?.label).toContain('2 visits');
  });

  test('vehicleCount of 0 falls back to 1 (never zero-prices a vehicle-dependent fee)', () => {
    const result = computePricing(
      baseInput({
        pax: 2,
        vehicleId: 'veh-1',
        vehicleCount: 0,
        vehicles: [{ id: 'veh-1', perDayRate: 100 }],
        parkAncillaryFees: [ancillaryOnce],
        days: [twoDaysAtPark[0]!],
      }),
    );
    const once = result.lineItems.find((l) => l.key.includes('Vehicle entry'));
    expect(once?.totalCost).toBe(50);
  });

  test('negative vehicleCount also falls back to 1', () => {
    const result = computePricing(
      baseInput({
        pax: 2,
        vehicleId: 'veh-1',
        vehicleCount: -3,
        vehicles: [{ id: 'veh-1', perDayRate: 100 }],
        parkAncillaryFees: [ancillaryOnce],
        days: [twoDaysAtPark[0]!],
      }),
    );
    const once = result.lineItems.find((l) => l.key.includes('Vehicle entry'));
    expect(once?.totalCost).toBe(50);
  });
});

describe('computePricing — activities', () => {
  const perPersonActivity: ActivityRate = {
    activityId: 'act-1',
    activityName: 'Walking safari',
    seasonId: null,
    chargeBasis: 'per_person',
    rate: 50,
  };
  const perGroupActivity: ActivityRate = {
    activityId: 'act-2',
    activityName: 'Balloon safari',
    seasonId: null,
    chargeBasis: 'per_group',
    rate: 500,
  };

  test('per_person activity charges rate * pax', () => {
    const result = computePricing(
      baseInput({
        pax: 3,
        activityRates: [perPersonActivity],
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, activities: [{ libraryId: 'act-1' }] }],
      }),
    );
    expect(result.lineItems[0]).toMatchObject({ quantity: 3, unitCost: 50, totalCost: 150 });
  });

  test('per_group activity charges the flat rate once regardless of pax', () => {
    const result = computePricing(
      baseInput({
        pax: 6,
        activityRates: [perGroupActivity],
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, activities: [{ libraryId: 'act-2' }] }],
      }),
    );
    expect(result.lineItems[0]).toMatchObject({ quantity: 1, unitCost: 500, totalCost: 500 });
  });

  test('optional activities are skipped entirely (priced separately as extras elsewhere)', () => {
    const result = computePricing(
      baseInput({
        pax: 3,
        activityRates: [perPersonActivity],
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, activities: [{ libraryId: 'act-1', isOptional: true }] }],
      }),
    );
    expect(result.lineItems).toEqual([]);
  });

  test('game drives are silently skipped even with no configured rate (no warning, no $0 line)', () => {
    const result = computePricing(
      baseInput({
        pax: 3,
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, activities: [{ name: 'Morning Game Drive' }] }],
      }),
    );
    expect(result.lineItems).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  test('activity matched by free-text name (case/whitespace-insensitive) when no libraryId is set', () => {
    const result = computePricing(
      baseInput({
        pax: 2,
        activityRates: [perPersonActivity],
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, activities: [{ name: '  Walking Safari  ' }] }],
      }),
    );
    expect(result.lineItems[0]?.totalCost).toBe(100);
  });

  test('missing activity rate warns and adds a $0 line priced at full pax (assumes per-person)', () => {
    const result = computePricing(
      baseInput({
        pax: 4,
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, activities: [{ name: 'Cultural visit' }] }],
      }),
    );
    expect(result.lineItems[0]).toMatchObject({ quantity: 4, unitCost: 0, totalCost: 0, missing: 'rate not configured' });
    expect(result.warnings).toMatchObject([{ kind: 'missing_activity_rate' }]);
  });

  test('activity with neither libraryId nor a name is silently ignored', () => {
    const result = computePricing(
      baseInput({
        pax: 2,
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, activities: [{}] }],
      }),
    );
    expect(result.lineItems).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  test('multiple activities on the same day each get a distinct key', () => {
    const result = computePricing(
      baseInput({
        pax: 2,
        activityRates: [perPersonActivity, perGroupActivity],
        days: [
          {
            dayNumber: 1,
            date: new Date(Date.UTC(2026, 6, 1)),
            accommodationId: null,
            mealPlan: null,
            rooms: [],
            parkId: null,
            activities: [{ libraryId: 'act-1' }, { libraryId: 'act-2' }],
          },
        ],
      }),
    );
    expect(result.lineItems).toHaveLength(2);
    expect(new Set(result.lineItems.map((l) => l.key)).size).toBe(2);
  });
});

describe('computePricing — vehicle', () => {
  test('vehicle line multiplies per-day rate by trip days and vehicle count', () => {
    const result = computePricing(
      baseInput({
        vehicleId: 'veh-1',
        vehicleCount: 2,
        vehicles: [{ id: 'veh-1', perDayRate: 150 }],
        days: [
          { dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null },
          { dayNumber: 2, date: new Date(Date.UTC(2026, 6, 2)), accommodationId: null, mealPlan: null, rooms: [], parkId: null },
          { dayNumber: 3, date: new Date(Date.UTC(2026, 6, 3)), accommodationId: null, mealPlan: null, rooms: [], parkId: null },
        ],
      }),
    );
    expect(result.lineItems[0]).toMatchObject({ quantity: 6, unitCost: 150, totalCost: 900 });
  });

  test('no days but a selected vehicle prices zero trip days (quantity 0)', () => {
    const result = computePricing(baseInput({ vehicleId: 'veh-1', vehicles: [{ id: 'veh-1', perDayRate: 150 }] }));
    expect(result.lineItems[0]).toMatchObject({ quantity: 0, totalCost: 0 });
  });

  test('vehicle selected but not found in the rate list warns instead of throwing', () => {
    const result = computePricing(baseInput({ vehicleId: 'veh-missing', vehicles: [] }));
    expect(result.lineItems).toEqual([]);
    expect(result.warnings).toMatchObject([{ kind: 'missing_vehicle' }]);
  });

  test('no vehicleId means no vehicle line and no warning', () => {
    const result = computePricing(baseInput({ vehicleId: null }));
    expect(result.lineItems).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});

describe('computePricing — transfers', () => {
  const perPaxTransfer: TransferRate = { id: 't-1', name: 'Airport pickup', mode: 'per_pax', rate: 40 };
  const perVehicleTransfer: TransferRate = { id: 't-2', name: 'Airport dropoff', mode: 'per_vehicle', rate: 80 };

  test('per_pax transfer multiplies by trip pax', () => {
    const result = computePricing(baseInput({ pax: 5, pickupTransferId: 't-1', transferRates: [perPaxTransfer] }));
    expect(result.lineItems[0]).toMatchObject({ quantity: 5, unitCost: 40, totalCost: 200 });
  });

  test('per_vehicle transfer charges the flat rate regardless of pax', () => {
    const result = computePricing(baseInput({ pax: 5, dropoffTransferId: 't-2', transferRates: [perVehicleTransfer] }));
    expect(result.lineItems[0]).toMatchObject({ quantity: 1, unitCost: 80, totalCost: 80 });
  });

  test('both pickup and dropoff selected produce two independent lines', () => {
    const result = computePricing(
      baseInput({ pax: 2, pickupTransferId: 't-1', dropoffTransferId: 't-2', transferRates: [perPaxTransfer, perVehicleTransfer] }),
    );
    expect(result.lineItems).toHaveLength(2);
    expect(result.costSubtotal).toBe(80 + 80);
  });

  test('selected transfer not found in rate list warns without a crash', () => {
    const result = computePricing(baseInput({ pickupTransferId: 't-missing', transferRates: [] }));
    expect(result.lineItems).toEqual([]);
    expect(result.warnings).toMatchObject([{ kind: 'missing_transfer' }]);
  });

  test('no transfers selected produces neither lines nor warnings', () => {
    const result = computePricing(baseInput({}));
    expect(result.lineItems).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});

describe('computePricing — internal cost lines', () => {
  test('quantity defaults to 1 for legacy rows with no quantity field', () => {
    const result = computePricing(baseInput({ internalCostLines: [{ id: 'ic-1', label: 'Concession fee', amount: 250 }] }));
    expect(result.lineItems[0]).toMatchObject({ quantity: 1, unitCost: 250, totalCost: 250 });
  });

  test('explicit quantity multiplies amount as a per-unit rate', () => {
    const result = computePricing(
      baseInput({ internalCostLines: [{ id: 'ic-1', label: 'Extra transfer', amount: 40, quantity: 3 }] }),
    );
    expect(result.lineItems[0]).toMatchObject({ quantity: 3, unitCost: 40, totalCost: 120 });
  });

  test('quantity of 0 also falls back to 1 (matches the ">0" guard, not "!= null")', () => {
    const result = computePricing(
      baseInput({ internalCostLines: [{ id: 'ic-1', label: 'Odd row', amount: 40, quantity: 0 }] }),
    );
    expect(result.lineItems[0]).toMatchObject({ quantity: 1, totalCost: 40 });
  });

  test('multiple internal lines are all included independently', () => {
    const result = computePricing(
      baseInput({
        internalCostLines: [
          { id: 'ic-1', label: 'Fee A', amount: 100 },
          { id: 'ic-2', label: 'Fee B', amount: 200, quantity: 2 },
        ],
      }),
    );
    expect(result.costSubtotal).toBe(100 + 400);
  });

  test('null internalCostLines behaves like an empty list', () => {
    const result = computePricing(baseInput({ internalCostLines: null }));
    expect(result.lineItems).toEqual([]);
  });
});

describe('computePricing — overrides', () => {
  const perPaxTransfer: TransferRate = { id: 't-1', name: 'Airport pickup', mode: 'per_pax', rate: 40 };

  test('override replaces unitCost/totalCost and recomputes totalCost as quantity * rate', () => {
    const result = computePricing(
      baseInput({ pax: 5, pickupTransferId: 't-1', transferRates: [perPaxTransfer], overrides: { 'transfer:pickup': 60 } }),
    );
    expect(result.lineItems[0]).toMatchObject({ unitCost: 60, totalCost: 300, overridden: true, originalUnitCost: 40, originalTotalCost: 200 });
  });

  test('overriding a missing-rate line clears its "missing" flag and suppresses its warning', () => {
    const result = computePricing(
      baseInput({
        pax: 4,
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, activities: [{ name: 'Cultural visit' }] }],
        overrides: {
          [`activity:cultural visit:1:0`]: 25,
        },
      }),
    );
    const line = result.lineItems[0]!;
    expect(line.missing).toBeUndefined();
    expect(line.overridden).toBe(true);
    expect(line.totalCost).toBe(100); // 4 pax * 25
    expect(result.warnings).toEqual([]);
  });

  test('overriding a genuinely zero-quantity line totals to $0, not to the override rate', () => {
    // Regression: a vehicle selected on a zero-day trip has quantity: 0. The
    // override math used to fall back to treating that as quantity 1, so
    // overriding it to $999/day priced the whole line at $999 instead of $0.
    const result = computePricing(
      baseInput({ vehicleId: 'veh-1', vehicles: [{ id: 'veh-1', perDayRate: 150 }], overrides: { vehicle: 999 } }),
    );
    expect(result.lineItems[0]).toMatchObject({ quantity: 0, unitCost: 999, totalCost: 0 });
  });

  test('override key with no matching line item is a no-op (not an error)', () => {
    const result = computePricing(baseInput({ overrides: { 'nonexistent:key': 999 } }));
    expect(result.lineItems).toEqual([]);
    expect(result.costSubtotal).toBe(0);
  });

  test('overrides object with no matching keys leaves all warnings intact', () => {
    const result = computePricing(
      baseInput({
        pax: 2,
        vehicleId: 'veh-missing',
        vehicles: [],
        overrides: { 'some:other:key': 10 },
      }),
    );
    expect(result.warnings).toMatchObject([{ kind: 'missing_vehicle' }]);
  });
});

describe('computePricing — totals, markup, and rounding', () => {
  test('markup is applied to the cost subtotal and both per-pax figures divide correctly', () => {
    const result = computePricing(
      baseInput({
        pax: 4,
        markupPct: 25,
        internalCostLines: [{ id: 'ic-1', label: 'Base cost', amount: 1000 }],
      }),
    );
    expect(result.costSubtotal).toBe(1000);
    expect(result.markupAmount).toBe(250);
    expect(result.sellTotal).toBe(1250);
    expect(result.costPerPax).toBe(250);
    expect(result.sellPerPax).toBe(312.5);
  });

  test('markupPct of 0 leaves sellTotal equal to costSubtotal', () => {
    const result = computePricing(baseInput({ pax: 2, markupPct: 0, internalCostLines: [{ id: 'ic-1', label: 'X', amount: 500 }] }));
    expect(result.markupAmount).toBe(0);
    expect(result.sellTotal).toBe(500);
  });

  test('pax of 0 avoids divide-by-zero and returns 0 for both per-pax figures', () => {
    const result = computePricing(baseInput({ pax: 0, internalCostLines: [{ id: 'ic-1', label: 'X', amount: 500 }] }));
    expect(result.costPerPax).toBe(0);
    expect(result.sellPerPax).toBe(0);
    expect(result.costSubtotal).toBe(500); // subtotal itself is unaffected by pax
  });

  test('negative markupPct reduces the sell price below cost (underwater pricing is representable, not blocked)', () => {
    const result = computePricing(baseInput({ pax: 2, markupPct: -10, internalCostLines: [{ id: 'ic-1', label: 'X', amount: 1000 }] }));
    expect(result.markupAmount).toBe(-100);
    expect(result.sellTotal).toBe(900);
  });

  test('totals round to 2dp and avoid classic floating-point drift (0.1 + 0.2 style errors)', () => {
    const result = computePricing(
      baseInput({
        pax: 3,
        markupPct: 10,
        internalCostLines: [
          { id: 'ic-1', label: 'A', amount: 10.1 },
          { id: 'ic-2', label: 'B', amount: 10.2 },
        ],
      }),
    );
    expect(result.costSubtotal).toBe(20.3);
    expect(result.markupAmount).toBe(2.03);
    expect(result.sellTotal).toBe(22.33);
  });

  test('costSubtotal sums across every line source (accommodation, park, activity, vehicle, transfer, internal)', () => {
    const accRate: AccommodationRate = {
      accommodationId: 'acc-1',
      seasonId: 'season-1',
      roomType: 'double',
      mealPlan: 'bb',
      perPaxRate: 100,
      rateBasis: 'per_person',
      maxOccupancy: 2,
      additionalAdultPct: null,
      additionalChildPct: null,
    };
    const parkRate: ParkFeeRate = { parkId: 'park-1', parkName: 'Test Park', seasonId: null, category: 'non_resident_adult', perPersonRate: 50 };
    const activityRate: ActivityRate = { activityId: 'act-1', activityName: 'Walk', seasonId: null, chargeBasis: 'per_person', rate: 20 };
    const vehicle: VehicleRate = { id: 'veh-1', perDayRate: 100 };
    const transfer: TransferRate = { id: 't-1', name: 'Pickup', mode: 'per_pax', rate: 10 };

    const result = computePricing(
      baseInput({
        pax: 2,
        markupPct: 0,
        seasons: [yearRoundSeason],
        accommodationRates: [accRate],
        parkFeeRates: [parkRate],
        activityRates: [activityRate],
        vehicles: [vehicle],
        vehicleId: 'veh-1',
        pickupTransferId: 't-1',
        transferRates: [transfer],
        internalCostLines: [{ id: 'ic-1', label: 'Misc', amount: 15 }],
        days: [
          {
            dayNumber: 1,
            date: new Date(Date.UTC(2026, 6, 1)),
            accommodationId: 'acc-1',
            mealPlan: 'bb',
            rooms: [{ roomType: 'double', pax: 2 }],
            parkId: 'park-1',
            activities: [{ libraryId: 'act-1' }],
          },
        ],
      }),
    );
    // acc 200 + park 100 + activity 40 + vehicle 100 + transfer 20 + internal 15
    expect(result.costSubtotal).toBe(475);
    expect(result.sellTotal).toBe(475);
  });
});
