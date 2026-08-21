import { describe, expect, test } from 'bun:test';
import {
  computePricing,
  deriveMealPlan,
  occupantSlotCost,
  resolveSeason,
  type AccommodationRate,
  type ActivityRate,
  type FlightRate,
  type GuideRate,
  type ItineraryDayInput,
  type MealRate,
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

// ---------------------------------------------------------------------------
// computePricing — vehicle capacity auto-bump
// ---------------------------------------------------------------------------

describe('computePricing — vehicle capacity auto-bump', () => {
  const vehicle: VehicleRate = { id: 'veh-1', perDayRate: 250, seatCapacity: 6 };

  test('pax within capacity leaves vehicleCount untouched', () => {
    const result = computePricing(
      baseInput({ pax: 5, vehicleId: 'veh-1', vehicleCount: 1, vehicles: [vehicle] }),
    );
    expect(result.lineItems[0]?.quantity).toBe(0); // no days in baseInput, but no capacity warning either
    expect(result.warnings.some((w) => w.kind === 'vehicle_capacity_exceeded')).toBe(false);
  });

  test('pax exceeding one vehicle auto-bumps the effective count and warns', () => {
    const result = computePricing(
      baseInput({
        pax: 8,
        vehicleId: 'veh-1',
        vehicleCount: 1,
        vehicles: [vehicle],
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, dayKind: 'touring' }],
      }),
    );
    // ceil(8/6) = 2 vehicles, even though the caller only asked for 1
    expect(result.lineItems[0]).toMatchObject({ quantity: 2, totalCost: 500 });
    expect(result.warnings).toMatchObject([{ kind: 'vehicle_capacity_exceeded' }]);
  });

  test("operator's vehicleCount acts as a floor — never reduced below what was explicitly set", () => {
    const result = computePricing(
      baseInput({
        pax: 2,
        vehicleId: 'veh-1',
        vehicleCount: 3, // more vehicles than strictly needed, e.g. extra space requested
        vehicles: [vehicle],
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, dayKind: 'touring' }],
      }),
    );
    expect(result.lineItems[0]).toMatchObject({ quantity: 3, totalCost: 750 });
    expect(result.warnings.some((w) => w.kind === 'vehicle_capacity_exceeded')).toBe(false);
  });

  test('no seatCapacity configured means no auto-bump (today\'s behavior preserved)', () => {
    const result = computePricing(
      baseInput({
        pax: 20,
        vehicleId: 'veh-1',
        vehicleCount: 1,
        vehicles: [{ id: 'veh-1', perDayRate: 250 }], // no seatCapacity
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, dayKind: 'touring' }],
      }),
    );
    expect(result.lineItems[0]).toMatchObject({ quantity: 1, totalCost: 250 });
    expect(result.warnings).toEqual([]);
  });

  test('the bumped vehicle count also multiplies per-vehicle ancillary fees, not just the vehicle line', () => {
    const ancillary: ParkAncillaryFeeRate = {
      parkId: 'park-1',
      parkName: 'Ngorongoro Crater',
      seasonId: null,
      name: 'Crater descent fee',
      chargeBasis: 'per_vehicle_once_per_visit',
      rate: 200,
    };
    const result = computePricing(
      baseInput({
        pax: 10,
        vehicleId: 'veh-1',
        vehicleCount: 1,
        vehicles: [vehicle],
        parkAncillaryFees: [ancillary],
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: 'park-1', dayKind: 'touring' }],
      }),
    );
    // ceil(10/6) = 2 vehicles -> crater fee charged twice, once per vehicle
    const crater = result.lineItems.find((l) => l.key.includes('Crater'));
    expect(crater?.totalCost).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// computePricing — vehicle 'none' days (beach extensions etc.)
// ---------------------------------------------------------------------------

describe('computePricing — vehicle day-kind exclusions', () => {
  const vehicle: VehicleRate = { id: 'veh-1', perDayRate: 250 };

  test('touring days are charged, airport_transfer and none days are not', () => {
    const days: ItineraryDayInput[] = [
      { dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, dayKind: 'airport_transfer' },
      { dayNumber: 2, date: new Date(Date.UTC(2026, 6, 2)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, dayKind: 'touring' },
      { dayNumber: 3, date: new Date(Date.UTC(2026, 6, 3)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, dayKind: 'touring' },
      { dayNumber: 4, date: new Date(Date.UTC(2026, 6, 4)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, dayKind: 'none' },
      { dayNumber: 5, date: new Date(Date.UTC(2026, 6, 5)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, dayKind: 'none' },
    ];
    const result = computePricing(baseInput({ vehicleId: 'veh-1', vehicles: [vehicle], days }));
    // only the 2 touring days are charged, not the transfer day or the 2 beach days
    expect(result.lineItems[0]).toMatchObject({ quantity: 2, totalCost: 500 });
  });

  test('unset dayKind defaults to touring (backward compatible with every prior test)', () => {
    const days: ItineraryDayInput[] = [
      { dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null },
    ];
    const result = computePricing(baseInput({ vehicleId: 'veh-1', vehicles: [vehicle], days }));
    expect(result.lineItems[0]).toMatchObject({ quantity: 1, totalCost: 250 });
  });
});

// ---------------------------------------------------------------------------
// computePricing — guide fee
// ---------------------------------------------------------------------------

describe('computePricing — guide fee', () => {
  const guide: GuideRate = { id: 'guide-1', name: 'Standard guide', touringRate: 60, airportTransferRate: 10 };
  const days: ItineraryDayInput[] = [
    { dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, dayKind: 'airport_transfer' },
    { dayNumber: 2, date: new Date(Date.UTC(2026, 6, 2)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, dayKind: 'touring' },
    { dayNumber: 3, date: new Date(Date.UTC(2026, 6, 3)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, dayKind: 'touring' },
    { dayNumber: 4, date: new Date(Date.UTC(2026, 6, 4)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, dayKind: 'none' },
  ];

  test('touring and airport-transfer days are priced at their own distinct rate', () => {
    const result = computePricing(baseInput({ guideId: 'guide-1', guides: [guide], days }));
    const touring = result.lineItems.find((l) => l.key === 'guide:touring');
    const transfer = result.lineItems.find((l) => l.key === 'guide:airport_transfer');
    expect(touring).toMatchObject({ quantity: 2, unitCost: 60, totalCost: 120 });
    expect(transfer).toMatchObject({ quantity: 1, unitCost: 10, totalCost: 10 });
  });

  test('"none" days contribute no guide cost at all', () => {
    const result = computePricing(baseInput({ guideId: 'guide-1', guides: [guide], days }));
    expect(result.costSubtotal).toBe(130); // 120 touring + 10 transfer, nothing for the "none" day
  });

  test('no guideId selected means no guide line, but warns about the unpriced transfer day', () => {
    const result = computePricing(baseInput({ days }));
    expect(result.lineItems.some((l) => l.source === 'guide')).toBe(false);
    expect(result.warnings).toMatchObject([{ kind: 'unpriced_transfer_day', dayNumber: 1 }]);
  });

  test('a first-day airport transfer covered by the pickup transfer rate does not warn', () => {
    const result = computePricing(baseInput({ days, pickupTransferId: 'pickup-1' }));
    expect(result.warnings.some((w) => w.kind === 'unpriced_transfer_day')).toBe(false);
  });

  test('a last-day airport transfer covered by the dropoff transfer rate does not warn', () => {
    const lastDayTransfer: ItineraryDayInput[] = [
      days[0]!,
      days[1]!,
      days[2]!,
      { ...days[3]!, dayKind: 'airport_transfer' },
    ];
    const result = computePricing(
      baseInput({ days: lastDayTransfer, pickupTransferId: 'pickup-1', dropoffTransferId: 'dropoff-1' }),
    );
    expect(result.warnings.some((w) => w.kind === 'unpriced_transfer_day')).toBe(false);
  });

  test('an airport transfer day already priced as a flight leg does not warn about vehicle/guide cost', () => {
    const flightDay: ItineraryDayInput[] = [
      { ...days[0]!, flightId: 'flight-1' },
      days[1]!,
      days[2]!,
      days[3]!,
    ];
    const result = computePricing(baseInput({ days: flightDay }));
    expect(result.warnings.some((w) => w.kind === 'unpriced_transfer_day')).toBe(false);
  });

  test('guideId set but not found in the rate list warns instead of throwing', () => {
    const result = computePricing(baseInput({ guideId: 'missing-guide', guides: [], days }));
    expect(result.lineItems.some((l) => l.source === 'guide')).toBe(false);
    expect(result.warnings).toMatchObject([{ kind: 'missing_guide' }]);
  });

  test('guide cost multiplies by effectiveVehicleCount, one guide per vehicle', () => {
    const result = computePricing(
      baseInput({ guideId: 'guide-1', guides: [guide], vehicleCount: 2, days }),
    );
    const touring = result.lineItems.find((l) => l.key === 'guide:touring');
    expect(touring?.totalCost).toBe(240); // 60 * 2 touring days * 2 vehicles
  });
});

// ---------------------------------------------------------------------------
// computePricing — per-person park ancillary fees (concession)
// ---------------------------------------------------------------------------

describe('computePricing — per-person park ancillary fees', () => {
  const concession: ParkAncillaryFeeRate = {
    parkId: 'park-1',
    parkName: 'Serengeti National Park',
    seasonId: null,
    name: 'Concession fee',
    chargeBasis: 'per_person_per_day',
    rate: 59,
  };
  const twoDaysAtPark = [
    { dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: 'park-1' },
    { dayNumber: 2, date: new Date(Date.UTC(2026, 6, 2)), accommodationId: null, mealPlan: null, rooms: [], parkId: 'park-1' },
  ];

  test('scales with headcount, not vehicle count, and needs no vehicle selected', () => {
    const result = computePricing(
      baseInput({ pax: 4, vehicleId: null, parkAncillaryFees: [concession], days: twoDaysAtPark }),
    );
    const line = result.lineItems.find((l) => l.key.includes('Concession'));
    expect(line?.totalCost).toBe(472); // $59 * 2 nights * 4 pax
    expect(result.warnings.some((w) => w.kind === 'missing_park_ancillary_no_vehicle')).toBe(false);
  });

  test('a category-specific row only charges the matching traveler segment', () => {
    const childConcession: ParkAncillaryFeeRate = { ...concession, rate: 11.8, category: 'non_resident_child' };
    const adultConcession: ParkAncillaryFeeRate = { ...concession, category: 'non_resident_adult' };
    const result = computePricing(
      baseInput({
        pax: 4,
        travelerBreakdown: [
          { category: 'non_resident_adult', count: 2 },
          { category: 'non_resident_child', count: 2 },
        ],
        parkAncillaryFees: [adultConcession, childConcession],
        days: twoDaysAtPark,
      }),
    );
    const adultLine = result.lineItems.find((l) => l.key.endsWith('non_resident_adult'));
    const childLine = result.lineItems.find((l) => l.key.endsWith('non_resident_child'));
    expect(adultLine?.totalCost).toBe(236); // 59 * 2 days * 2 adults
    expect(childLine?.totalCost).toBe(47.2); // 11.8 * 2 days * 2 children
  });

  test('a vehicle-basis fee and a per-person-basis fee at the same park coexist independently', () => {
    const crater: ParkAncillaryFeeRate = {
      parkId: 'park-1',
      parkName: 'Serengeti National Park',
      seasonId: null,
      name: 'Vehicle entry fee',
      chargeBasis: 'per_vehicle_once_per_visit',
      rate: 50,
    };
    const result = computePricing(
      baseInput({
        pax: 2,
        vehicleId: 'veh-1',
        vehicles: [{ id: 'veh-1', perDayRate: 100 }],
        parkAncillaryFees: [concession, crater],
        days: twoDaysAtPark,
      }),
    );
    const concessionLine = result.lineItems.find((l) => l.key.includes('Concession'));
    const craterLine = result.lineItems.find((l) => l.key.includes('Vehicle entry'));
    expect(concessionLine?.totalCost).toBe(236); // 59 * 2 days * 2 pax, no vehicle needed
    expect(craterLine?.totalCost).toBe(50); // unaffected by the per-person fee alongside it
  });
});

// ---------------------------------------------------------------------------
// computePricing — transit fee
// ---------------------------------------------------------------------------

describe('computePricing — transit fee', () => {
  const entranceRate: ParkFeeRate = {
    parkId: 'park-1',
    parkName: 'Ngorongoro Conservation Area',
    seasonId: null,
    category: 'non_resident_adult',
    perPersonRate: 70.8,
  };
  const transitRate: ParkFeeRate = { ...entranceRate, perPersonRate: 25, feeType: 'transit' };

  test('a transit day prefers the transit-rate row over the full entrance fee', () => {
    const result = computePricing(
      baseInput({
        pax: 2,
        parkFeeRates: [entranceRate, transitRate],
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: 'park-1', isTransit: true }],
      }),
    );
    expect(result.lineItems[0]).toMatchObject({ unitCost: 25, totalCost: 50 });
    expect(result.warnings).toEqual([]);
  });

  test('a non-transit day is unaffected by a transit rate existing on the same park', () => {
    const result = computePricing(
      baseInput({
        pax: 2,
        parkFeeRates: [entranceRate, transitRate],
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: 'park-1' }],
      }),
    );
    expect(result.lineItems[0]).toMatchObject({ unitCost: 70.8, totalCost: 141.6 });
  });

  test('a transit day with no transit rate configured falls back to the entrance fee and warns (never silently free)', () => {
    const result = computePricing(
      baseInput({
        pax: 2,
        parkFeeRates: [entranceRate], // no transit-type row at all
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: 'park-1', isTransit: true }],
      }),
    );
    expect(result.lineItems[0]).toMatchObject({ unitCost: 70.8, totalCost: 141.6 });
    expect(result.warnings).toMatchObject([{ kind: 'missing_transit_fee', dayNumber: 1 }]);
  });

  test('rows with no feeType set behave exactly as entrance rows (legacy data unaffected)', () => {
    const legacyRow: ParkFeeRate = { ...entranceRate }; // feeType left undefined
    const result = computePricing(
      baseInput({
        pax: 1,
        parkFeeRates: [legacyRow],
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: 'park-1' }],
      }),
    );
    expect(result.lineItems[0]?.unitCost).toBe(70.8);
    expect(result.warnings).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// computePricing — meals (lunchbox)
// ---------------------------------------------------------------------------

describe('computePricing — meals', () => {
  const lunchbox: MealRate = { id: 'meal-1', name: 'Lunchbox', perPersonRate: 15 };

  test('a day with mealCostId set charges the meal rate per person', () => {
    const result = computePricing(
      baseInput({
        pax: 3,
        mealRates: [lunchbox],
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, mealCostId: 'meal-1' }],
      }),
    );
    expect(result.lineItems[0]).toMatchObject({ quantity: 3, unitCost: 15, totalCost: 45, source: 'meal' });
  });

  test('days without mealCostId incur no meal cost', () => {
    const result = computePricing(
      baseInput({
        pax: 3,
        mealRates: [lunchbox],
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null }],
      }),
    );
    expect(result.lineItems).toEqual([]);
  });

  test('mealCostId set but not found warns and adds a $0 line rather than skipping silently', () => {
    const result = computePricing(
      baseInput({
        pax: 2,
        mealRates: [],
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, mealCostId: 'missing-meal' }],
      }),
    );
    expect(result.lineItems[0]).toMatchObject({ unitCost: 0, totalCost: 0, missing: 'rate not configured' });
    expect(result.warnings).toMatchObject([{ kind: 'missing_meal_rate', dayNumber: 1 }]);
  });
});

// ---------------------------------------------------------------------------
// computePricing — flights
// ---------------------------------------------------------------------------

describe('computePricing — flights', () => {
  const znzFlight: FlightRate = { id: 'flight-1', name: 'Arusha-Zanzibar', seasonId: null, perPersonRate: 240 };

  test('a day with flightId set charges the flight rate per person', () => {
    const result = computePricing(
      baseInput({
        pax: 2,
        flightRates: [znzFlight],
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, flightId: 'flight-1' }],
      }),
    );
    expect(result.lineItems[0]).toMatchObject({ quantity: 2, unitCost: 240, totalCost: 480, source: 'flight' });
  });

  test('a season-specific flight rate is preferred over the season-less fallback', () => {
    const seasonalFlight: FlightRate = { ...znzFlight, seasonId: 'season-1', perPersonRate: 280 };
    const result = computePricing(
      baseInput({
        pax: 1,
        seasons: [yearRoundSeason],
        flightRates: [znzFlight, seasonalFlight],
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, flightId: 'flight-1' }],
      }),
    );
    expect(result.lineItems[0]?.unitCost).toBe(280);
  });

  test('flightId set but not found warns and adds a $0 line', () => {
    const result = computePricing(
      baseInput({
        pax: 2,
        flightRates: [],
        days: [{ dayNumber: 1, date: new Date(Date.UTC(2026, 6, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, flightId: 'missing-flight' }],
      }),
    );
    expect(result.lineItems[0]).toMatchObject({ unitCost: 0, totalCost: 0, missing: 'rate not configured' });
    expect(result.warnings).toMatchObject([{ kind: 'missing_flight_rate' }]);
  });
});

// ---------------------------------------------------------------------------
// computePricing — tiered markup
// ---------------------------------------------------------------------------

describe('computePricing — tiered markup', () => {
  test('with no tiers configured, flat markupPct applies exactly as before', () => {
    const result = computePricing(
      baseInput({ pax: 4, markupPct: 20, internalCostLines: [{ id: 'ic-1', label: 'Cost', amount: 1000 }] }),
    );
    expect(result.markupPct).toBe(20);
    expect(result.sellTotal).toBe(1200);
  });

  test('a matching tier overrides the flat markupPct', () => {
    const result = computePricing(
      baseInput({
        pax: 6,
        markupPct: 30,
        markupTiers: [
          { minPax: 1, markupPct: 30 },
          { minPax: 4, markupPct: 25 },
          { minPax: 6, markupPct: 22 },
        ],
        internalCostLines: [{ id: 'ic-1', label: 'Cost', amount: 1000 }],
      }),
    );
    expect(result.markupPct).toBe(22);
    expect(result.sellTotal).toBe(1220);
  });

  test('pax below every tier\'s minPax falls back to the flat markupPct', () => {
    const result = computePricing(
      baseInput({
        pax: 1,
        markupPct: 35,
        markupTiers: [{ minPax: 2, markupPct: 20 }],
        internalCostLines: [{ id: 'ic-1', label: 'Cost', amount: 1000 }],
      }),
    );
    expect(result.markupPct).toBe(35);
  });

  test('the highest qualifying tier wins, regardless of array order', () => {
    const result = computePricing(
      baseInput({
        pax: 10,
        markupPct: 30,
        markupTiers: [
          { minPax: 6, markupPct: 22 },
          { minPax: 1, markupPct: 30 },
          { minPax: 8, markupPct: 20 },
        ],
        internalCostLines: [{ id: 'ic-1', label: 'Cost', amount: 1000 }],
      }),
    );
    expect(result.markupPct).toBe(20);
  });

  test('null/empty markupTiers behaves exactly like no tiers at all', () => {
    const result = computePricing(
      baseInput({ pax: 6, markupPct: 20, markupTiers: [], internalCostLines: [{ id: 'ic-1', label: 'Cost', amount: 1000 }] }),
    );
    expect(result.markupPct).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// computePricing — Bobby Tours reconciliation (real cost sheets)
// ----------------------------------------------------------------
// These three fixtures rebuild real Bobby Tours quotes (Chiraz, Akuom Junior,
// Maireke — cost sheets downloaded 2026-08-20) entirely from rate-card-shaped
// inputs, using the engine's new guide/transit/meal/flight/per-person-
// ancillary support. Each one asserts computePricing() reproduces the sheet's
// own grand total (at markupPct: 0, since these are cost sheets, not sell
// prices) to the cent. Where the source sheet has a genuine gap the engine
// still can't close on its own — a single day double-booked across two
// parks, or a third transfer leg beyond pickup/dropoff — the fixture uses an
// internalCostLine, exactly as an operator would today, and a comment says so.
// ---------------------------------------------------------------------------

describe('computePricing — Bobby Tours reconciliation (real cost sheets)', () => {
  test('Chiraz (2 pax, 7 days, mainland only) matches the cost sheet total of $5,077.80', () => {
    const seasons: SeasonBand[] = [
      { id: 's1', name: 'Trip season', startMonth: 1, startDay: 1, endMonth: 12, endDay: 31, priority: 0 },
    ];
    const acc = (id: string, perPaxRate: number): AccommodationRate => ({
      accommodationId: id,
      seasonId: 's1',
      roomType: 'double',
      mealPlan: 'fb',
      perPaxRate,
      rateBasis: 'per_person',
      maxOccupancy: 2,
      additionalAdultPct: null,
      additionalChildPct: null,
    });
    const accommodationRates = [
      acc('venus', 42),
      acc('marera', 105),
      acc('enkirari', 185.5),
      acc('mysigio', 230),
    ];
    const parkFeeRates: ParkFeeRate[] = [
      { parkId: 'tarangire', parkName: 'Tarangire National Park', seasonId: null, category: 'non_resident_adult', perPersonRate: 79 },
      { parkId: 'serengeti', parkName: 'Serengeti National Park', seasonId: null, category: 'non_resident_adult', perPersonRate: 102.6 },
      { parkId: 'ngorongoro-nca', parkName: 'Ngorongoro Conservation Area', seasonId: null, category: 'non_resident_adult', perPersonRate: 90.8 },
      // 'ngorongoro-crater' deliberately has NO entrance rate — it's a
      // fee-only sub-feature (crater descent), same pattern the engine
      // already documents for parksWithAnyFeeRate.
    ];
    const parkAncillaryFees: ParkAncillaryFeeRate[] = [
      { parkId: 'serengeti', parkName: 'Serengeti National Park', seasonId: null, name: 'Concession fee', chargeBasis: 'per_person_per_day', rate: 90.8 },
      { parkId: 'ngorongoro-nca', parkName: 'Ngorongoro Conservation Area', seasonId: null, name: 'Concession fee', chargeBasis: 'per_person_per_day', rate: 79 },
      { parkId: 'ngorongoro-crater', parkName: 'Ngorongoro Crater', seasonId: null, name: 'Crater descent fee', chargeBasis: 'per_vehicle_once_per_visit', rate: 345 },
    ];
    const rooms = [{ roomType: 'double', pax: 2 }];
    const days: ItineraryDayInput[] = [
      { dayNumber: 1, date: new Date(Date.UTC(2026, 8, 6)), accommodationId: 'venus', accommodationName: 'Venus', mealPlan: 'fb', rooms, parkId: null, dayKind: 'airport_transfer' },
      { dayNumber: 2, date: new Date(Date.UTC(2026, 8, 7)), accommodationId: 'marera', accommodationName: 'Marera Valley', mealPlan: 'fb', rooms, parkId: 'tarangire', dayKind: 'touring', mealCostId: 'lunchbox' },
      { dayNumber: 3, date: new Date(Date.UTC(2026, 8, 8)), accommodationId: 'enkirari', accommodationName: 'Enkirari', mealPlan: 'fb', rooms, parkId: 'serengeti', dayKind: 'touring' },
      { dayNumber: 4, date: new Date(Date.UTC(2026, 8, 9)), accommodationId: 'enkirari', accommodationName: 'Enkirari', mealPlan: 'fb', rooms, parkId: 'serengeti', dayKind: 'touring' },
      { dayNumber: 5, date: new Date(Date.UTC(2026, 8, 10)), accommodationId: 'mysigio', accommodationName: 'Mysigio tented camp', mealPlan: 'fb', rooms, parkId: 'ngorongoro-nca', dayKind: 'touring' },
      { dayNumber: 6, date: new Date(Date.UTC(2026, 8, 11)), accommodationId: 'venus', accommodationName: 'Venus', mealPlan: 'fb', rooms, parkId: 'ngorongoro-crater', dayKind: 'touring' },
      { dayNumber: 7, date: new Date(Date.UTC(2026, 8, 12)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, dayKind: 'airport_transfer' },
    ];
    const result = computePricing(
      baseInput({
        pax: 2,
        markupPct: 0,
        seasons,
        accommodationRates,
        parkFeeRates,
        parkAncillaryFees,
        vehicleId: 'veh-1',
        vehicles: [{ id: 'veh-1', perDayRate: 250, seatCapacity: 6 }],
        guideId: 'guide-1',
        guides: [{ id: 'guide-1', name: 'Standard guide', touringRate: 60, airportTransferRate: 10 }],
        mealRates: [{ id: 'lunchbox', name: 'Lunchbox', perPersonRate: 15 }],
        pickupTransferId: 't-pickup',
        dropoffTransferId: 't-dropoff',
        transferRates: [
          { id: 't-pickup', name: 'Airport pickup', mode: 'per_vehicle', rate: 50 },
          { id: 't-dropoff', name: 'Airport dropoff', mode: 'per_vehicle', rate: 50 },
        ],
        // Day 3 (Sept 8) shows both a Serengeti entrance fee AND a separate
        // $90.80/pax "Transit" charge the same day — almost certainly a
        // second, smaller park (e.g. Ngorongoro) transited en route, which
        // the engine can't represent since a day only resolves to one
        // parkId. Handled as a manual line, same as an operator would today.
        internalCostLines: [{ id: 'transit-day3', label: 'NCA transit fee (Day 3, second park same day)', amount: 90.8 * 2, quantity: 1 }],
        days,
      }),
    );
    expect(result.costSubtotal).toBe(5077.8);
    expect(result.warnings.some((w) => w.kind === 'vehicle_capacity_exceeded')).toBe(false);
  });

  test('Akuom Junior (2 pax, 5 days, mainland only) matches the cost sheet total of $3,432.00', () => {
    const acc = (id: string, perPaxRate: number): AccommodationRate => ({
      accommodationId: id,
      seasonId: 's1',
      roomType: 'double',
      mealPlan: 'fb',
      perPaxRate,
      rateBasis: 'per_person',
      maxOccupancy: 2,
      additionalAdultPct: null,
      additionalChildPct: null,
    });
    const rooms = [{ roomType: 'double', pax: 2 }];
    const days: ItineraryDayInput[] = [
      { dayNumber: 1, date: new Date(Date.UTC(2026, 4, 16)), accommodationId: 'kankari', accommodationName: 'Kankari Lodge Karatu', mealPlan: 'fb', rooms, parkId: 'tarangire', dayKind: 'touring', mealCostId: 'lunchbox' },
      { dayNumber: 2, date: new Date(Date.UTC(2026, 4, 17)), accommodationId: 'tukaone', accommodationName: 'Tukaone Weavers Serengeti Camp', mealPlan: 'fb', rooms, parkId: 'serengeti-arrival', dayKind: 'touring' },
      { dayNumber: 3, date: new Date(Date.UTC(2026, 4, 18)), accommodationId: 'ngoro-tortilis', accommodationName: 'Ngoro Tortilis', mealPlan: 'fb', rooms, parkId: 'serengeti-central', dayKind: 'touring' },
      { dayNumber: 4, date: new Date(Date.UTC(2026, 4, 19)), accommodationId: 'marera', accommodationName: 'Marera Valley', mealPlan: 'fb', rooms, parkId: 'ngorongoro-crater', dayKind: 'touring' },
      { dayNumber: 5, date: new Date(Date.UTC(2026, 4, 20)), accommodationId: null, mealPlan: null, rooms: [], parkId: 'lake-manyara', dayKind: 'touring' },
    ];
    // 'serengeti-arrival' and 'serengeti-central' are the same physical park
    // priced two different ways across two consecutive nights (a partial
    // arrival-day rate, then the full day rate) — modeled as two catalog
    // sub-entries under one park, the same parent/child pattern the codebase
    // already uses for Ngorongoro NCA vs Ngorongoro Crater.
    const parkFeeRates: ParkFeeRate[] = [
      { parkId: 'tarangire', parkName: 'Tarangire National Park', seasonId: null, category: 'non_resident_adult', perPersonRate: 25 },
      { parkId: 'serengeti-arrival', parkName: 'Serengeti National Park', seasonId: null, category: 'non_resident_adult', perPersonRate: 25 },
      { parkId: 'serengeti-central', parkName: 'Serengeti National Park', seasonId: null, category: 'non_resident_adult', perPersonRate: 50 },
      { parkId: 'ngorongoro-crater', parkName: 'Ngorongoro Crater', seasonId: null, category: 'non_resident_adult', perPersonRate: 25 },
      { parkId: 'lake-manyara', parkName: 'Lake Manyara National Park', seasonId: null, category: 'non_resident_adult', perPersonRate: 25 },
    ];
    const parkAncillaryFees: ParkAncillaryFeeRate[] = [
      { parkId: 'serengeti-arrival', parkName: 'Serengeti National Park', seasonId: null, name: 'Concession fee', chargeBasis: 'per_person_per_day', rate: 35 },
      { parkId: 'serengeti-central', parkName: 'Serengeti National Park', seasonId: null, name: 'Concession fee', chargeBasis: 'per_person_per_day', rate: 35 },
      { parkId: 'ngorongoro-crater', parkName: 'Ngorongoro Crater', seasonId: null, name: 'Crater descent fee', chargeBasis: 'per_vehicle_once_per_visit', rate: 345 },
    ];
    const result = computePricing(
      baseInput({
        pax: 2,
        markupPct: 0,
        seasons: [{ id: 's1', name: 'Trip season', startMonth: 1, startDay: 1, endMonth: 12, endDay: 31, priority: 0 }],
        accommodationRates: [acc('kankari', 92.5), acc('tukaone', 121), acc('ngoro-tortilis', 252), acc('marera', 115.5)],
        parkFeeRates,
        parkAncillaryFees,
        vehicleId: 'veh-1',
        vehicles: [{ id: 'veh-1', perDayRate: 250, seatCapacity: 6 }],
        guideId: 'guide-1',
        guides: [{ id: 'guide-1', name: 'Standard guide', touringRate: 35, airportTransferRate: 10 }],
        mealRates: [{ id: 'lunchbox', name: 'Lunchbox', perPersonRate: 15 }],
        // Day 2's separate $15/pax "Transit" charge is a second park (e.g.
        // Ngorongoro) transited en route to Serengeti the same day — same
        // single-park-per-day gap as the Chiraz fixture above.
        internalCostLines: [{ id: 'transit-day2', label: 'NCA transit fee (Day 2, second park same day)', amount: 15 * 2, quantity: 1 }],
        days,
      }),
    );
    expect(result.costSubtotal).toBe(3432);
  });

  test('Maireke (2 pax, 9 days, mainland + Zanzibar extension) matches the cost sheet total of $6,734.00', () => {
    const acc = (id: string, perPaxRate: number): AccommodationRate => ({
      accommodationId: id,
      seasonId: 's1',
      roomType: 'double',
      mealPlan: 'fb',
      perPaxRate,
      rateBasis: 'per_person',
      maxOccupancy: 2,
      additionalAdultPct: null,
      additionalChildPct: null,
    });
    const rooms = [{ roomType: 'double', pax: 2 }];
    const days: ItineraryDayInput[] = [
      { dayNumber: 1, date: new Date(Date.UTC(2026, 11, 24)), accommodationId: 'sanna', accommodationName: 'Sanna', mealPlan: 'fb', rooms, parkId: null, dayKind: 'airport_transfer' },
      { dayNumber: 2, date: new Date(Date.UTC(2026, 11, 25)), accommodationId: 'marera-b', accommodationName: 'Marera', mealPlan: 'fb', rooms, parkId: 'tarangire', dayKind: 'touring', mealCostId: 'lunchbox' },
      { dayNumber: 3, date: new Date(Date.UTC(2026, 11, 26)), accommodationId: 'ndutu-luxury', accommodationName: 'Lake Ndutu Luxury', mealPlan: 'fb', rooms, parkId: 'ndutu-nca', dayKind: 'touring' },
      { dayNumber: 4, date: new Date(Date.UTC(2026, 11, 27)), accommodationId: 'ndutu-luxury', accommodationName: 'Lake Ndutu Luxury', mealPlan: 'fb', rooms, parkId: 'ndutu-nca', dayKind: 'touring' },
      // Day 5 is a mega-day (Ndutu -> crater -> Arusha -> flight -> Zanzibar):
      // the NCA/crater-transit entrance fee and the crater descent fee both
      // belong to a park visited only in passing that morning, so — same
      // single-park-per-day gap as the other two fixtures — they're manual
      // lines below rather than attached to a parkId.
      { dayNumber: 5, date: new Date(Date.UTC(2026, 11, 28)), accommodationId: 'zanzibar-magic', accommodationName: 'Zanzibar Magic', mealPlan: 'fb', rooms, parkId: 'zanzibar-marine', dayKind: 'touring', flightId: 'znz-flight' },
      { dayNumber: 6, date: new Date(Date.UTC(2026, 11, 29)), accommodationId: 'zanzibar-magic', accommodationName: 'Zanzibar Magic', mealPlan: 'fb', rooms, parkId: 'zanzibar-marine', dayKind: 'none' },
      { dayNumber: 7, date: new Date(Date.UTC(2026, 11, 30)), accommodationId: 'zanzibar-magic', accommodationName: 'Zanzibar Magic', mealPlan: 'fb', rooms, parkId: 'zanzibar-marine', dayKind: 'none' },
      { dayNumber: 8, date: new Date(Date.UTC(2026, 11, 31)), accommodationId: 'zanzibar-magic', accommodationName: 'Zanzibar Magic', mealPlan: 'fb', rooms, parkId: 'zanzibar-marine', dayKind: 'none' },
      { dayNumber: 9, date: new Date(Date.UTC(2027, 0, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, dayKind: 'none' },
    ];
    const parkFeeRates: ParkFeeRate[] = [
      { parkId: 'tarangire', parkName: 'Tarangire National Park', seasonId: null, category: 'non_resident_adult', perPersonRate: 79 },
      { parkId: 'ndutu-nca', parkName: 'Ngorongoro Conservation Area', seasonId: null, category: 'non_resident_adult', perPersonRate: 90.8 },
      // 'zanzibar-marine' carries only the ancillary levy below, no entrance fee.
    ];
    const parkAncillaryFees: ParkAncillaryFeeRate[] = [
      { parkId: 'ndutu-nca', parkName: 'Ngorongoro Conservation Area', seasonId: null, name: 'Concession fee', chargeBasis: 'per_person_per_day', rate: 79 },
      { parkId: 'ndutu-nca', parkName: 'Ngorongoro Conservation Area', seasonId: null, name: 'Migratory area fee', chargeBasis: 'per_vehicle_per_day', rate: 50 },
      { parkId: 'zanzibar-marine', parkName: 'Zanzibar', seasonId: null, name: 'Marine conservation levy', chargeBasis: 'per_person_per_day', rate: 10 },
    ];
    const result = computePricing(
      baseInput({
        pax: 2,
        markupPct: 0,
        seasons: [{ id: 's1', name: 'Trip season', startMonth: 1, startDay: 1, endMonth: 12, endDay: 31, priority: 0 }],
        accommodationRates: [
          acc('sanna', 85),
          acc('marera-b', 105),
          acc('ndutu-luxury', 324),
          acc('zanzibar-magic', 185.5),
        ],
        parkFeeRates,
        parkAncillaryFees,
        vehicleId: 'veh-1',
        vehicles: [{ id: 'veh-1', perDayRate: 250, seatCapacity: 6 }],
        guideId: 'guide-1',
        guides: [{ id: 'guide-1', name: 'Standard guide', touringRate: 35, airportTransferRate: 10 }],
        mealRates: [{ id: 'lunchbox', name: 'Lunchbox', perPersonRate: 15 }],
        flightRates: [{ id: 'znz-flight', name: 'Arusha-Zanzibar', seasonId: null, perPersonRate: 240 }],
        pickupTransferId: 't-pickup',
        dropoffTransferId: 't-dropoff',
        transferRates: [
          { id: 't-pickup', name: 'Airport pickup', mode: 'per_vehicle', rate: 50 },
          { id: 't-dropoff', name: 'ZNZ departure transfer', mode: 'per_vehicle', rate: 60 },
        ],
        internalCostLines: [
          // Day 5's crater-transit entrance fee ($90.90/pax, its own park
          // visited only in passing — see the day-5 comment above).
          { id: 'day5-nca-transit', label: 'Ngorongoro/crater transit fee (Day 5)', amount: 90.9 * 2, quantity: 1 },
          { id: 'day5-crater', label: 'Crater descent fee (Day 5)', amount: 345, quantity: 1 },
          // A third transfer leg (the local Arusha->airport run on flight
          // day) beyond the engine's single pickup/dropoff pair.
          { id: 'day5-extra-transfer', label: 'Local transfer to domestic flight (Day 5)', amount: 60, quantity: 1 },
          // Zanzibar's nightly per-room levy — see the "no additive
          // accommodation surcharge layer" finding in the audit; this is the
          // documented workaround until that's built.
          { id: 'znz-levy', label: 'Zanzibar nightly levy (4 nights)', amount: 200, quantity: 1 },
        ],
        days,
      }),
    );
    expect(result.costSubtotal).toBe(6734);
  });

  test('Maireke at the sheet\'s stated 3 adults costs strictly more than the sheet\'s own (2-pax-divided) total', () => {
    // The Maireke sheet is headed "3 adults" but every shared cost (vehicle,
    // guide, crater, transfers, migratory fee, Zanzibar levy) is divided by
    // 2, not 3 — see the pricing audit. Re-running the same rate card at the
    // header's stated pax proves the engine doesn't reproduce that error: a
    // real 3rd traveler adds their own accommodation/park/concession/lunch/
    // flight share on top, landing well above the sheet's $6,734.00.
    const acc = (id: string, perPaxRate: number): AccommodationRate => ({
      accommodationId: id,
      seasonId: 's1',
      roomType: 'triple',
      mealPlan: 'fb',
      perPaxRate,
      rateBasis: 'per_person',
      maxOccupancy: 3,
      additionalAdultPct: null,
      additionalChildPct: null,
    });
    const rooms = [{ roomType: 'triple', pax: 3 }];
    const days: ItineraryDayInput[] = [
      { dayNumber: 1, date: new Date(Date.UTC(2026, 11, 24)), accommodationId: 'sanna', accommodationName: 'Sanna', mealPlan: 'fb', rooms, parkId: null, dayKind: 'airport_transfer' },
      { dayNumber: 2, date: new Date(Date.UTC(2026, 11, 25)), accommodationId: 'marera-b', accommodationName: 'Marera', mealPlan: 'fb', rooms, parkId: 'tarangire', dayKind: 'touring', mealCostId: 'lunchbox' },
      { dayNumber: 3, date: new Date(Date.UTC(2026, 11, 26)), accommodationId: 'ndutu-luxury', accommodationName: 'Lake Ndutu Luxury', mealPlan: 'fb', rooms, parkId: 'ndutu-nca', dayKind: 'touring' },
      { dayNumber: 4, date: new Date(Date.UTC(2026, 11, 27)), accommodationId: 'ndutu-luxury', accommodationName: 'Lake Ndutu Luxury', mealPlan: 'fb', rooms, parkId: 'ndutu-nca', dayKind: 'touring' },
      { dayNumber: 5, date: new Date(Date.UTC(2026, 11, 28)), accommodationId: 'zanzibar-magic', accommodationName: 'Zanzibar Magic', mealPlan: 'fb', rooms, parkId: 'zanzibar-marine', dayKind: 'touring', flightId: 'znz-flight' },
      { dayNumber: 6, date: new Date(Date.UTC(2026, 11, 29)), accommodationId: 'zanzibar-magic', accommodationName: 'Zanzibar Magic', mealPlan: 'fb', rooms, parkId: 'zanzibar-marine', dayKind: 'none' },
      { dayNumber: 7, date: new Date(Date.UTC(2026, 11, 30)), accommodationId: 'zanzibar-magic', accommodationName: 'Zanzibar Magic', mealPlan: 'fb', rooms, parkId: 'zanzibar-marine', dayKind: 'none' },
      { dayNumber: 8, date: new Date(Date.UTC(2026, 11, 31)), accommodationId: 'zanzibar-magic', accommodationName: 'Zanzibar Magic', mealPlan: 'fb', rooms, parkId: 'zanzibar-marine', dayKind: 'none' },
      { dayNumber: 9, date: new Date(Date.UTC(2027, 0, 1)), accommodationId: null, mealPlan: null, rooms: [], parkId: null, dayKind: 'none' },
    ];
    const parkFeeRates: ParkFeeRate[] = [
      { parkId: 'tarangire', parkName: 'Tarangire National Park', seasonId: null, category: 'non_resident_adult', perPersonRate: 79 },
      { parkId: 'ndutu-nca', parkName: 'Ngorongoro Conservation Area', seasonId: null, category: 'non_resident_adult', perPersonRate: 90.8 },
    ];
    const parkAncillaryFees: ParkAncillaryFeeRate[] = [
      { parkId: 'ndutu-nca', parkName: 'Ngorongoro Conservation Area', seasonId: null, name: 'Concession fee', chargeBasis: 'per_person_per_day', rate: 79 },
      { parkId: 'ndutu-nca', parkName: 'Ngorongoro Conservation Area', seasonId: null, name: 'Migratory area fee', chargeBasis: 'per_vehicle_per_day', rate: 50 },
      { parkId: 'zanzibar-marine', parkName: 'Zanzibar', seasonId: null, name: 'Marine conservation levy', chargeBasis: 'per_person_per_day', rate: 10 },
    ];
    const result = computePricing(
      baseInput({
        pax: 3,
        markupPct: 0,
        seasons: [{ id: 's1', name: 'Trip season', startMonth: 1, startDay: 1, endMonth: 12, endDay: 31, priority: 0 }],
        accommodationRates: [
          acc('sanna', 85),
          acc('marera-b', 105),
          acc('ndutu-luxury', 324),
          acc('zanzibar-magic', 185.5),
        ],
        parkFeeRates,
        parkAncillaryFees,
        vehicleId: 'veh-1',
        vehicles: [{ id: 'veh-1', perDayRate: 250, seatCapacity: 6 }],
        guideId: 'guide-1',
        guides: [{ id: 'guide-1', name: 'Standard guide', touringRate: 35, airportTransferRate: 10 }],
        mealRates: [{ id: 'lunchbox', name: 'Lunchbox', perPersonRate: 15 }],
        flightRates: [{ id: 'znz-flight', name: 'Arusha-Zanzibar', seasonId: null, perPersonRate: 240 }],
        pickupTransferId: 't-pickup',
        dropoffTransferId: 't-dropoff',
        transferRates: [
          { id: 't-pickup', name: 'Airport pickup', mode: 'per_vehicle', rate: 50 },
          { id: 't-dropoff', name: 'ZNZ departure transfer', mode: 'per_vehicle', rate: 60 },
        ],
        internalCostLines: [
          { id: 'day5-nca-transit', label: 'Ngorongoro/crater transit fee (Day 5)', amount: 90.9 * 3, quantity: 1 },
          { id: 'day5-crater', label: 'Crater descent fee (Day 5)', amount: 345, quantity: 1 },
          { id: 'day5-extra-transfer', label: 'Local transfer to domestic flight (Day 5)', amount: 60, quantity: 1 },
          { id: 'znz-levy', label: 'Zanzibar nightly levy (4 nights)', amount: 200, quantity: 1 },
        ],
        days,
      }),
    );
    // I * 3 + S = 2384.50 * 3 + 1965.00 = 9118.50, strictly above the sheet's
    // own (flawed) 2-pax-divided total of $6,734.00.
    expect(result.costSubtotal).toBe(9118.5);
    expect(result.costSubtotal).toBeGreaterThan(6734);
  });
});
