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

import type { InternalCostLine } from '@repo/db/schema';

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
  // Per-person rates only: % of perPaxRate applied to any adult beyond the
  // 1st/2nd (which are always 100% = perPaxRate itself), and to any child.
  // Null = not modeled, falls back to 100% (today's flat-multiply behavior).
  additionalAdultPct: number | null;
  additionalChildPct: number | null;
}

// Cost of one room's occupants at a per_person rate, applying the extra-adult
// and child %s beyond the 1st/2nd adult (the perPaxRate baseline). `children`
// is a subset of `pax`; unset/0 means every occupant is priced as an adult
// slot, and no % configured defaults to 100% - together these mean a rate with
// neither column set reduces to exactly perPaxRate * pax, i.e. the
// pre-existing flat-multiply behavior is unchanged.
export function occupantSlotCost(
  rate: Pick<AccommodationRate, 'perPaxRate' | 'additionalAdultPct' | 'additionalChildPct'>,
  pax: number,
  children: number,
): number {
  const adults = Math.max(0, pax - Math.max(0, children));
  const pct = (p: number | null) => (p ?? 100) / 100;
  let total = 0;
  for (let i = 1; i <= adults; i++) {
    total += rate.perPaxRate * (i <= 2 ? 1 : pct(rate.additionalAdultPct));
  }
  total += Math.max(0, children) * rate.perPaxRate * pct(rate.additionalChildPct);
  return total;
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
  // Subset of pax that are children, for occupant-slot pricing (see
  // occupantSlotCost). Unset/0 means every occupant prices as an adult slot.
  children?: number;
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
  // How many of that vehicle the trip uses (e.g. 2 Land Cruisers for a large
  // group). Multiplies the vehicle-per-day line and per-vehicle park
  // ancillary fees (crater fees, vehicle entry fees, etc.). Defaults to 1.
  vehicleCount: number;
  pickupTransferId: string | null;
  dropoffTransferId: string | null;
  markupPct: number; // e.g. 30 => +30%
  currency: string;
  // Operator-entered per-unit rate per line, keyed by LineItem.key (e.g. to
  // fill in a "rate not configured" row, or correct a computed rate) without
  // needing a rate card entry or dropping out of auto pricing. Stored as a
  // rate rather than a flat total so totalCost = quantity * rate stays
  // correct if the line's quantity (pax, rooms, days…) changes later.
  overrides?: Record<string, number> | null;
  // Operator-added lines with no day-by-day counterpart (e.g. a concession
  // fee, an extra transfer). Counted into the total; see InternalCostLine.
  internalCostLines?: InternalCostLine[] | null;

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
  // Stable identity for this line, derived from the underlying entities (not
  // the display label) so a manual override in `PricingInput.overrides`
  // survives itinerary wording changes. Unique within one computePricing() call.
  key: string;
  label: string;
  dayNumber?: number;
  quantity: number;
  unitCost: number;
  totalCost: number;
  source: 'accommodation' | 'park_fee' | 'activity' | 'vehicle' | 'transfer' | 'internal';
  missing?: string; // human-readable note if a rate could not be found
  // Set when unitCost/totalCost were replaced by an entry in PricingInput.overrides.
  overridden?: boolean;
  // The engine-computed values before the override was applied (only present
  // when overridden is true), so the UI can offer "reset to computed".
  originalUnitCost?: number;
  originalTotalCost?: number;
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
  // For the "missing rate" kinds, the LineItem.key this warning is about — lets
  // the override pass suppress the warning once the operator fills the line in.
  key?: string;
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

// Seasons are shared org-wide, not per-hotel/park/activity, so a broad season
// belonging to one entity (e.g. Chumbe's Jun-Sep "High") can outrank a narrower
// season belonging to a different entity (e.g. Aluna's Jul-Aug "High Summer") on
// the same date. Restrict candidates to the seasons the specific entity actually
// has rates under before resolving, falling back to the full list only if it has
// none (so a not-yet-priced entity still gets a season for a useful warning).
function ownedSeasons(seasons: SeasonBand[], ownedIds: Set<string>): SeasonBand[] {
  if (ownedIds.size === 0) return seasons;
  const filtered = seasons.filter((s) => ownedIds.has(s.id));
  return filtered.length > 0 ? filtered : seasons;
}

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

const PROTECTED_AREA_RE = /\b(national\s+park|conservation\s+area|national\s+reserve|game\s+reserve)\b/i;

function resolveParkIdByName(destinationName: string, parkFeeRates: ParkFeeRate[]): string | null {
  // normalizeParkName strips the "National Park"/"Conservation Area"/etc.
  // suffix from both sides before comparing, so a plain city day (e.g.
  // "Arusha") would otherwise collide with a same-named protected area
  // ("Arusha National Park"). Only attempt the match when the destination
  // text itself names a protected area — city/transit days never resolve
  // to a park and so never surface a park-fee warning.
  if (!PROTECTED_AREA_RE.test(destinationName)) return null;
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
  const vehicleCount = input.vehicleCount && input.vehicleCount > 0 ? input.vehicleCount : 1;
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
    const accommodationSeasonIds = new Set(
      input.accommodationRates
        .filter((r) => r.accommodationId === day.accommodationId)
        .map((r) => r.seasonId),
    );
    const season = resolveSeason(day.date, ownedSeasons(input.seasons, accommodationSeasonIds));
    if (!season) {
      warnings.push({
        kind: 'no_season',
        dayNumber: day.dayNumber,
        message: `${hotelName} (Day ${day.dayNumber}): no season matches ${day.date.toDateString()}`,
      });
      continue;
    }
    for (const [roomIndex, room] of validRooms.entries()) {
      const roomKey = `acc:${day.accommodationId}:${day.dayNumber}:${room.roomType}:${day.mealPlan}:${roomIndex}`;
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
          key: roomKey,
        });
        lineItems.push({
          key: roomKey,
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
          key: roomKey,
          label: `${hotelName} (Day ${day.dayNumber}) — ${room.roomType}/${day.mealPlan} (per room)`,
          dayNumber: day.dayNumber,
          quantity: roomsNeeded,
          unitCost: rate.perPaxRate,
          totalCost: num(rate.perPaxRate * roomsNeeded),
          source: 'accommodation',
        });
      } else {
        // Occupant-slot pricing (see occupantSlotCost): correctly prices any
        // pax count on its own (extra-occupant % discounts apply per slot),
        // regardless of the room's stated max occupancy, so no action is
        // needed from the operator when a room mix exceeds it. Reduces to
        // perPaxRate * room.pax when no slot %s are configured on the rate.
        const totalCost = num(occupantSlotCost(rate, room.pax, room.children ?? 0));
        lineItems.push({
          key: roomKey,
          label: `${hotelName} (Day ${day.dayNumber}) — ${room.roomType}/${day.mealPlan}`,
          dayNumber: day.dayNumber,
          quantity: room.pax,
          unitCost: room.pax > 0 ? num(totalCost / room.pax) : rate.perPaxRate,
          totalCost,
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

  // The destination field is shared between real fee-charging parks and
  // plain cities/landmarks (e.g. "Arusha City") from the same catalog, and an
  // operator can pick either one. Only treat a resolved park as fee-bearing
  // when it actually has a configured rate somewhere — an entrance fee or a
  // per-vehicle ancillary fee. That also covers fee-only sub-features like
  // "Ngorongoro Crater", which has no entrance fee of its own but does carry
  // a crater-descent ancillary fee.
  const hasConfiguredParkRate = (parkId: string) =>
    input.parkFeeRates.some((r) => r.parkId === parkId) ||
    input.parkAncillaryFees.some((r) => r.parkId === parkId);

  const daysWithParkId = input.days.map((day) => {
    const rawParkId =
      day.parkId ??
      (day.destinationName ? resolveParkIdByName(day.destinationName, input.parkFeeRates) : null);
    const parkId = rawParkId && hasConfiguredParkRate(rawParkId) ? rawParkId : null;
    return { day, parkId };
  });

  const segments =
    input.travelerBreakdown && input.travelerBreakdown.length > 0
      ? input.travelerBreakdown
      : [{ category: input.travelerCategory, count: pax }];
  const showCategory = segments.filter((s) => s.count > 0).length > 1;

  for (const { day, parkId } of daysWithParkId) {
    if (!parkId) continue;
    const parkSeasonIds = new Set(
      input.parkFeeRates
        .filter((r): r is ParkFeeRate & { seasonId: string } => r.parkId === parkId && r.seasonId !== null)
        .map((r) => r.seasonId),
    );
    const season = resolveSeason(day.date, ownedSeasons(input.seasons, parkSeasonIds));
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
        key: `park:${parkId}:${day.dayNumber}:${segment.category}`,
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
        const totalCost = num(fee.rate * occurrences * vehicleCount);
        const occurrenceLabel =
          fee.chargeBasis === 'per_vehicle_per_day' ? `${occurrences} day${occurrences === 1 ? '' : 's'}` : null;
        const vehicleLabel = vehicleCount > 1 ? `${vehicleCount} vehicles` : null;
        const suffix = [occurrenceLabel, vehicleLabel].filter(Boolean).join(' × ');
        lineItems.push({
          key: `park_ancillary:${parkId}:${fee.name}`,
          label: suffix
            ? `${fee.parkName || 'Park'} — ${fee.name} (${suffix})`
            : `${fee.parkName || 'Park'} — ${fee.name}`,
          dayNumber: firstEntry.day.dayNumber,
          quantity: occurrences * vehicleCount,
          unitCost: fee.rate,
          totalCost,
          source: 'park_fee',
        });
      }
    }
  }

  const normalizeName = (s: string) => s.trim().toLowerCase();
  // Game drives (morning/night/guided/…) are already paid for through the
  // vehicle-per-day rate and park fees — there's no separate supplier rate to
  // configure, so skip them entirely rather than showing a $0 line or warning.
  const isGameDrive = (s: string) => /game\s*drives?/i.test(s);
  for (const day of input.days) {
    if (!day.activities || day.activities.length === 0) continue;
    for (const [activityIndex, activity] of day.activities.entries()) {
      if (activity.isOptional) continue;
      if (activity.name && isGameDrive(activity.name)) continue;
      const nameKey = activity.name ? normalizeName(activity.name) : null;
      if (!activity.libraryId && !nameKey) continue;
      const matches = (r: ActivityRate) =>
        Boolean(
          (activity.libraryId && r.activityId === activity.libraryId) ||
            (!activity.libraryId && nameKey && normalizeName(r.activityName) === nameKey),
        );
      const activitySeasonIds = new Set(
        input.activityRates
          .filter((r): r is ActivityRate & { seasonId: string } => matches(r) && r.seasonId !== null)
          .map((r) => r.seasonId),
      );
      const season = resolveSeason(day.date, ownedSeasons(input.seasons, activitySeasonIds));
      const rate =
        input.activityRates.find((r) => matches(r) && r.seasonId === (season?.id ?? null)) ??
        input.activityRates.find((r) => matches(r) && r.seasonId === null);
      const activityLabel = activity.name?.trim() || rate?.activityName?.trim() || 'Activity';
      const activityKey = `activity:${activity.libraryId ?? nameKey}:${day.dayNumber}:${activityIndex}`;
      if (!rate) {
        // No rate object exists yet, so the per-person-vs-per-group basis is
        // unknown — assume per-person (the common case) so quantity is real
        // and a unit-rate override (see below) multiplies out correctly.
        warnings.push({
          kind: 'missing_activity_rate',
          dayNumber: day.dayNumber,
          message: `Day ${day.dayNumber}: no rate for "${activityLabel}"`,
          key: activityKey,
        });
        lineItems.push({
          key: activityKey,
          label: `${activityLabel} (Day ${day.dayNumber})`,
          dayNumber: day.dayNumber,
          quantity: pax,
          unitCost: 0,
          totalCost: 0,
          source: 'activity',
          missing: 'rate not configured',
        });
        continue;
      }
      if (rate.chargeBasis === 'per_group') {
        lineItems.push({
          key: activityKey,
          label: `${activityLabel} (Day ${day.dayNumber}) — per group`,
          dayNumber: day.dayNumber,
          quantity: 1,
          unitCost: rate.rate,
          totalCost: num(rate.rate),
          source: 'activity',
        });
      } else {
        lineItems.push({
          key: activityKey,
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
      const total = vehicle.perDayRate * tripDays * vehicleCount;
      lineItems.push({
        key: 'vehicle',
        label:
          vehicleCount > 1
            ? `Vehicle + driver + fuel (${tripDays} days × ${vehicleCount} vehicles)`
            : `Vehicle + driver + fuel (${tripDays} days)`,
        quantity: tripDays * vehicleCount,
        unitCost: vehicle.perDayRate,
        totalCost: num(total),
        source: 'vehicle',
      });
    }
  }

  // ---------- Transfers ----------
  const transferLegs: Array<{ leg: 'pickup' | 'dropoff'; transferId: string | null }> = [
    { leg: 'pickup', transferId: input.pickupTransferId },
    { leg: 'dropoff', transferId: input.dropoffTransferId },
  ];
  for (const { leg, transferId } of transferLegs) {
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
      key: `transfer:${leg}`,
      label: transfer.name,
      quantity: transfer.mode === 'per_pax' ? pax : 1,
      unitCost: transfer.rate,
      totalCost: num(total),
      source: 'transfer',
    });
  }

  // ---------- Internal cost lines ----------
  // Operator-only lines with no day-by-day counterpart (e.g. a concession fee,
  // an extra transfer beyond pickup/dropoff). Quantity is always 1 - `amount`
  // is the final total, already pax-multiplied at add-time if it came from a
  // per-person/per-pax rate.
  for (const line of input.internalCostLines ?? []) {
    lineItems.push({
      key: `internal:${line.id}`,
      label: line.label,
      quantity: 1,
      unitCost: line.amount,
      totalCost: num(line.amount),
      source: 'internal',
    });
  }

  // ---------- Manual overrides ----------
  // Applied last, by LineItem.key, so they win over whatever the rate cards
  // computed (or didn't) for that line. Stored as a rate (not a flat total) so
  // totalCost = quantity * rate stays correct if quantity (pax, rooms,
  // days…) changes later. Once a line is overridden, its "missing rate"
  // warning no longer applies — the operator has priced it.
  const overriddenKeys = new Set<string>();
  if (input.overrides) {
    for (const li of lineItems) {
      if (!Object.prototype.hasOwnProperty.call(input.overrides, li.key)) continue;
      const rate = input.overrides[li.key]!;
      li.originalUnitCost = li.unitCost;
      li.originalTotalCost = li.totalCost;
      li.unitCost = rate;
      li.totalCost = num((li.quantity || 1) * rate);
      li.overridden = true;
      li.missing = undefined;
      overriddenKeys.add(li.key);
    }
  }
  const activeWarnings =
    overriddenKeys.size === 0 ? warnings : warnings.filter((w) => !(w.key && overriddenKeys.has(w.key)));

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
    warnings: activeWarnings,
  };
}
