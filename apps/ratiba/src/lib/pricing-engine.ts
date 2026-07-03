// ============================================================
// Pricing engine
// ----------------------------------------------------------------
// Cost-plus pricing for a multi-day safari itinerary. Pulls supplier
// rates (hotels, parks, vehicle, transfers) from rate-card tables and
// applies a markup % to produce a per-person and total selling price.
//
// Pure functions — no DB calls. The tRPC procedure that exposes this
// loads the rate data and feeds it in.
// ============================================================

export type RoomType = string;
export type MealPlan = 'ro' | 'bb' | 'hb' | 'fb';

export function deriveMealPlan(meals?: {
  breakfast?: boolean | null;
  lunch?: boolean | null;
  dinner?: boolean | null;
}): MealPlan | null {
  if (!meals) return null;
  const b = !!meals.breakfast;
  const l = !!meals.lunch;
  const d = !!meals.dinner;
  const count = (b ? 1 : 0) + (l ? 1 : 0) + (d ? 1 : 0);
  if (count === 0) return 'ro'; // room only
  if (b && l && d) return 'fb'; // full board
  if (b && !l && !d) return 'bb'; // bed & breakfast
  return 'hb'; // breakfast + one other meal (or any partial combo): half board
}
export type ParkFeeCategory =
  | 'non_resident_adult'
  | 'non_resident_child'
  | 'east_african_resident_adult'
  | 'east_african_resident_child'
  | 'citizen_adult'
  | 'citizen_child';

export interface SeasonBand {
  id: string;
  name: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  priority: number;
}

export type RateBasis = 'per_person' | 'per_room';

export interface AccommodationRate {
  accommodationId: string;
  seasonId: string;
  roomType: RoomType;
  mealPlan: MealPlan;
  // `rate` is per traveler when basis is per_person, or a flat per-room price
  // when basis is per_room (in which case maxOccupancy is the room capacity).
  perPaxRate: number;
  rateBasis: RateBasis;
  maxOccupancy: number | null;
}

export interface ParkFeeRate {
  parkId: string;
  parkName: string;
  seasonId: string | null;
  category: ParkFeeCategory;
  perPersonRate: number;
}

export type ParkAncillaryChargeBasis = 'per_vehicle_per_day' | 'per_vehicle_once_per_visit';

export interface ParkAncillaryFeeRate {
  parkId: string;
  parkName: string;
  seasonId: string | null;
  name: string;
  chargeBasis: ParkAncillaryChargeBasis;
  rate: number;
}

export interface VehicleRate {
  id: string;
  perDayRate: number;
}

export interface TransferRate {
  id: string;
  name: string;
  mode: 'per_vehicle' | 'per_pax';
  rate: number;
}

export type ActivityChargeBasis = 'per_person' | 'per_group';

export interface ActivityRate {
  activityId: string;
  activityName: string;
  seasonId: string | null;
  chargeBasis: ActivityChargeBasis;
  rate: number;
}

export interface DayActivityInput {
  libraryId?: string | null;
  name?: string | null;
  isOptional?: boolean;
}

export interface RoomNight {
  roomType: RoomType | null;
  pax: number;
}

export interface ItineraryDayInput {
  dayNumber: number;
  date: Date; // calendar date for this day
  accommodationId: string | null;
  accommodationName?: string | null; // shown in the cost line label

  mealPlan: MealPlan | null;
  rooms: RoomNight[];
  parkId: string | null;
  destinationName?: string | null;
  activities?: DayActivityInput[];
}

export interface PricingInput {
  days: ItineraryDayInput[];
  pax: number;
  travelerCategory: ParkFeeCategory;
  travelerBreakdown?: Array<{ category: ParkFeeCategory; count: number }>;
  vehicleId: string | null;
  pickupTransferId: string | null;
  dropoffTransferId: string | null;
  markupPct: number; // e.g. 30 => +30%
  currency: string;

  // Rate-card data
  seasons: SeasonBand[];
  accommodationRates: AccommodationRate[];
  parkFeeRates: ParkFeeRate[];
  parkAncillaryFees: ParkAncillaryFeeRate[];
  vehicles: VehicleRate[];
  transferRates: TransferRate[];
  activityRates: ActivityRate[];
}

export interface LineItem {
  label: string;
  dayNumber?: number;
  quantity: number;
  unitCost: number;
  totalCost: number;
  source: 'accommodation' | 'park_fee' | 'activity' | 'vehicle' | 'transfer';
  missing?: string; // human-readable note if a rate could not be found
}

export type WarningKind =
  | 'missing_room_meal'
  | 'room_pax_mismatch'
  | 'missing_room_capacity'
  | 'no_season'
  | 'missing_hotel_rate'
  | 'missing_park_fee'
  | 'missing_park_ancillary_no_vehicle'
  | 'missing_activity_rate'
  | 'missing_vehicle'
  | 'missing_transfer';

export interface PricingWarning {
  kind: WarningKind;
  message: string;
  dayNumber?: number;
}

export interface PricingBreakdown {
  currency: string;
  lineItems: LineItem[];
  costSubtotal: number;
  markupPct: number;
  markupAmount: number;
  sellTotal: number;
  costPerPax: number;
  sellPerPax: number;
  pax: number;
  warnings: PricingWarning[];
}

// Pad MM-DD into a numeric value for cyclical comparison.
const md = (month: number, day: number) => month * 100 + day;

// Resolve a date to a season band. Season bands can wrap across the year
// boundary (e.g. Dec 20 - Jan 5). Highest-priority match wins on overlap.
export function resolveSeason(date: Date, seasons: SeasonBand[]): SeasonBand | null {
  const target = md(date.getUTCMonth() + 1, date.getUTCDate());
  const matches = seasons.filter((s) => {
    const start = md(s.startMonth, s.startDay);
    const end = md(s.endMonth, s.endDay);
    if (start <= end) return target >= start && target <= end;
    // wrap-around band (Dec -> Jan)
    return target >= start || target <= end;
  });
  if (matches.length === 0) return null;
  return matches.reduce((best, s) => (s.priority > best.priority ? s : best));
}

const num = (n: number) => Math.round(n * 100) / 100;

function parkCategoryLabel(category: ParkFeeCategory): string {
  return category.endsWith('_child') ? 'Children' : 'Adults';
}

function normalizeParkName(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\b(national\s+park|conservation\s+area|national\s+reserve|game\s+reserve)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveParkIdByName(destinationName: string, parkFeeRates: ParkFeeRate[]): string | null {
  const target = normalizeParkName(destinationName);
  if (!target) return null;
  for (const r of parkFeeRates) {
    if (!r.parkName) continue;
    if (normalizeParkName(r.parkName) === target) return r.parkId;
  }
  return null;
}

export function computePricing(input: PricingInput): PricingBreakdown {
  const { pax, markupPct, currency } = input;
  const warnings: PricingWarning[] = [];
  const lineItems: LineItem[] = [];
  const tripDays = input.days.length;

  // ---------- Accommodation lines (per day, one line per room type) ----------
  for (const day of input.days) {
    if (!day.accommodationId) continue;
    // Prefer the hotel's own name in the line label, fall back to a generic one.
    const hotelName = day.accommodationName?.trim() || 'Hotel night';
    // Only rooms with both a type and at least one traveler are priceable.
    const validRooms = day.rooms.filter((r) => r.roomType && r.pax > 0);
    if (!day.mealPlan || validRooms.length === 0) {
      warnings.push({
        kind: 'missing_room_meal',
        dayNumber: day.dayNumber,
        message: `${hotelName} (Day ${day.dayNumber}): room mix / meal plan not set, hotel cost skipped`,
      });
      continue;
    }
    const season = resolveSeason(day.date, input.seasons);
    if (!season) {
      warnings.push({
        kind: 'no_season',
        dayNumber: day.dayNumber,
        message: `${hotelName} (Day ${day.dayNumber}): no season matches ${day.date.toDateString()}`,
      });
      continue;
    }
    for (const room of validRooms) {
      const rate = input.accommodationRates.find(
        (r) =>
          r.accommodationId === day.accommodationId &&
          r.seasonId === season.id &&
          r.roomType === room.roomType &&
          r.mealPlan === day.mealPlan,
      );
      if (!rate) {
        warnings.push({
          kind: 'missing_hotel_rate',
          dayNumber: day.dayNumber,
          message: `${hotelName} (Day ${day.dayNumber}): no rate for ${room.roomType}/${day.mealPlan} in ${season.name}`,
        });
        lineItems.push({
          label: `${hotelName} (Day ${day.dayNumber}) — ${room.roomType}/${day.mealPlan}`,
          dayNumber: day.dayNumber,
          quantity: room.pax,
          unitCost: 0,
          totalCost: 0,
          source: 'accommodation',
          missing: 'rate not configured',
        });
        continue;
      }
      if (rate.rateBasis === 'per_room') {
        // Flat per-room price: derive how many rooms the pax need.
        const capacity = rate.maxOccupancy && rate.maxOccupancy > 0 ? rate.maxOccupancy : null;
        if (!capacity) {
          warnings.push({
            kind: 'missing_room_capacity',
            dayNumber: day.dayNumber,
            message: `Day ${day.dayNumber}: ${room.roomType} is priced per room but has no max occupancy set; charged as 1 room`,
          });
        }
        const roomsNeeded = capacity ? Math.max(1, Math.ceil(room.pax / capacity)) : 1;
        lineItems.push({
          label: `${hotelName} (Day ${day.dayNumber}) — ${room.roomType}/${day.mealPlan} (per room)`,
          dayNumber: day.dayNumber,
          quantity: roomsNeeded,
          unitCost: rate.perPaxRate,
          totalCost: num(rate.perPaxRate * roomsNeeded),
          source: 'accommodation',
        });
      } else {
        lineItems.push({
          label: `${hotelName} (Day ${day.dayNumber}) — ${room.roomType}/${day.mealPlan}`,
          dayNumber: day.dayNumber,
          quantity: room.pax,
          unitCost: rate.perPaxRate,
          totalCost: num(rate.perPaxRate * room.pax),
          source: 'accommodation',
        });
      }
    }
    // Flag (but still price) when the room mix doesn't cover every traveler.
    const assignedPax = validRooms.reduce((sum, r) => sum + r.pax, 0);
    if (assignedPax !== pax) {
      warnings.push({
        kind: 'room_pax_mismatch',
        dayNumber: day.dayNumber,
        message: `Day ${day.dayNumber}: rooms cover ${assignedPax} of ${pax} travelers`,
      });
    }
  }

  const daysWithParkId = input.days.map((day) => {
    const parkId =
      day.parkId ??
      (day.destinationName ? resolveParkIdByName(day.destinationName, input.parkFeeRates) : null);
    return { day, parkId };
  });

  const segments =
    input.travelerBreakdown && input.travelerBreakdown.length > 0
      ? input.travelerBreakdown
      : [{ category: input.travelerCategory, count: pax }];
  const showCategory = segments.filter((s) => s.count > 0).length > 1;

  for (const { day, parkId } of daysWithParkId) {
    if (!parkId) continue;
    const season = resolveSeason(day.date, input.seasons);
    for (const segment of segments) {
      if (segment.count <= 0) continue;
      // park fees: season-specific row preferred, fall back to season-less (year-round)
      const rate =
        input.parkFeeRates.find(
          (r) =>
            r.parkId === parkId &&
            r.category === segment.category &&
            r.seasonId === (season?.id ?? null),
        ) ??
        input.parkFeeRates.find(
          (r) => r.parkId === parkId && r.category === segment.category && r.seasonId === null,
        );
      if (!rate) {
        warnings.push({
          kind: 'missing_park_fee',
          dayNumber: day.dayNumber,
          message: `Day ${day.dayNumber}: no park fee for category ${segment.category}`,
        });
        continue;
      }
      const parkLabel = rate.parkName?.trim() || day.destinationName?.trim() || 'Park fee';
      const label = showCategory
        ? `${parkLabel} (Day ${day.dayNumber}) — ${parkCategoryLabel(segment.category)}`
        : `${parkLabel} (Day ${day.dayNumber})`;
      lineItems.push({
        label,
        dayNumber: day.dayNumber,
        quantity: segment.count,
        unitCost: rate.perPersonRate,
        totalCost: num(rate.perPersonRate * segment.count),
        source: 'park_fee',
      });
    }
  }

  if (input.parkAncillaryFees.length > 0) {
    const hasVehicle = !!input.vehicleId;
    const dayCountByPark = new Map<string, number>();
    const firstDayByPark = new Map<string, (typeof daysWithParkId)[number]>();
    for (const entry of daysWithParkId) {
      if (!entry.parkId) continue;
      dayCountByPark.set(entry.parkId, (dayCountByPark.get(entry.parkId) ?? 0) + 1);
      if (!firstDayByPark.has(entry.parkId)) firstDayByPark.set(entry.parkId, entry);
    }

    const feesByPark = new Map<string, ParkAncillaryFeeRate[]>();
    for (const fee of input.parkAncillaryFees) {
      const list = feesByPark.get(fee.parkId) ?? [];
      list.push(fee);
      feesByPark.set(fee.parkId, list);
    }

    for (const [parkId, dayCount] of dayCountByPark) {
      const fees = feesByPark.get(parkId);
      const firstFee = fees?.[0];
      if (!fees || !firstFee) continue;
      if (!hasVehicle) {
        warnings.push({
          kind: 'missing_park_ancillary_no_vehicle',
          message: `${firstFee.parkName || 'Park'}: vehicle-based fees skipped (no vehicle selected)`,
        });
        continue;
      }
      const firstEntry = firstDayByPark.get(parkId);
      if (!firstEntry) continue;
      for (const fee of fees) {
        const occurrences = fee.chargeBasis === 'per_vehicle_per_day' ? dayCount : 1;
        const totalCost = num(fee.rate * occurrences);
        lineItems.push({
          label:
            fee.chargeBasis === 'per_vehicle_per_day'
              ? `${fee.parkName || 'Park'} — ${fee.name} (${occurrences} day${occurrences === 1 ? '' : 's'})`
              : `${fee.parkName || 'Park'} — ${fee.name}`,
          dayNumber: firstEntry.day.dayNumber,
          quantity: occurrences,
          unitCost: fee.rate,
          totalCost,
          source: 'park_fee',
        });
      }
    }
  }

  const normalizeName = (s: string) => s.trim().toLowerCase();
  for (const day of input.days) {
    if (!day.activities || day.activities.length === 0) continue;
    const season = resolveSeason(day.date, input.seasons);
    for (const activity of day.activities) {
      if (activity.isOptional) continue;
      const nameKey = activity.name ? normalizeName(activity.name) : null;
      if (!activity.libraryId && !nameKey) continue;
      const matches = (r: ActivityRate) =>
        (activity.libraryId && r.activityId === activity.libraryId) ||
        (!activity.libraryId && nameKey && normalizeName(r.activityName) === nameKey);
      const rate =
        input.activityRates.find((r) => matches(r) && r.seasonId === (season?.id ?? null)) ??
        input.activityRates.find((r) => matches(r) && r.seasonId === null);
      const activityLabel = activity.name?.trim() || rate?.activityName?.trim() || 'Activity';
      if (!rate) {
        warnings.push({
          kind: 'missing_activity_rate',
          dayNumber: day.dayNumber,
          message: `Day ${day.dayNumber}: no rate for "${activityLabel}"`,
        });
        lineItems.push({
          label: `${activityLabel} (Day ${day.dayNumber})`,
          dayNumber: day.dayNumber,
          quantity: 0,
          unitCost: 0,
          totalCost: 0,
          source: 'activity',
          missing: 'rate not configured',
        });
        continue;
      }
      if (rate.chargeBasis === 'per_group') {
        lineItems.push({
          label: `${activityLabel} (Day ${day.dayNumber}) — per group`,
          dayNumber: day.dayNumber,
          quantity: 1,
          unitCost: rate.rate,
          totalCost: num(rate.rate),
          source: 'activity',
        });
      } else {
        lineItems.push({
          label: `${activityLabel} (Day ${day.dayNumber})`,
          dayNumber: day.dayNumber,
          quantity: pax,
          unitCost: rate.rate,
          totalCost: num(rate.rate * pax),
          source: 'activity',
        });
      }
    }
  }

  // ---------- Vehicle (one line, all days) ----------
  if (input.vehicleId) {
    const vehicle = input.vehicles.find((v) => v.id === input.vehicleId);
    if (!vehicle) {
      warnings.push({
        kind: 'missing_vehicle',
        message: 'Vehicle selected but rate not found',
      });
    } else {
      const total = vehicle.perDayRate * tripDays;
      lineItems.push({
        label: `Vehicle + driver + fuel (${tripDays} days)`,
        quantity: tripDays,
        unitCost: vehicle.perDayRate,
        totalCost: num(total),
        source: 'vehicle',
      });
    }
  }

  // ---------- Transfers ----------
  for (const transferId of [input.pickupTransferId, input.dropoffTransferId]) {
    if (!transferId) continue;
    const transfer = input.transferRates.find((t) => t.id === transferId);
    if (!transfer) {
      warnings.push({
        kind: 'missing_transfer',
        message: 'Transfer selected but rate not found',
      });
      continue;
    }
    const total = transfer.mode === 'per_pax' ? transfer.rate * pax : transfer.rate;
    lineItems.push({
      label: transfer.name,
      quantity: transfer.mode === 'per_pax' ? pax : 1,
      unitCost: transfer.rate,
      totalCost: num(total),
      source: 'transfer',
    });
  }

  // ---------- Totals ----------
  const costSubtotal = num(lineItems.reduce((sum, l) => sum + l.totalCost, 0));
  const markupAmount = num((costSubtotal * markupPct) / 100);
  const sellTotal = num(costSubtotal + markupAmount);
  const costPerPax = pax > 0 ? num(costSubtotal / pax) : 0;
  const sellPerPax = pax > 0 ? num(sellTotal / pax) : 0;

  return {
    currency,
    lineItems,
    costSubtotal,
    markupPct,
    markupAmount,
    sellTotal,
    costPerPax,
    sellPerPax,
    pax,
    warnings,
  };
}
