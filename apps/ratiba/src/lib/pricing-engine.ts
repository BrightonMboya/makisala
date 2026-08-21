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

// Human-readable composition of an occupant-slot-priced room (see
// occupantSlotCost), e.g. "2 adults + 2 extra adults @ 70%" — undefined when
// the room reduces to a flat perPaxRate * pax (no extra-adult/child %s in
// play), since there's nothing to explain in that case.
function describeOccupantBreakdown(
  rate: Pick<AccommodationRate, 'additionalAdultPct' | 'additionalChildPct'>,
  pax: number,
  children: number,
): string | undefined {
  const childCount = Math.max(0, Math.min(children, pax));
  const adults = Math.max(0, pax - childCount);
  if (adults <= 2 && childCount === 0) return undefined;
  const parts: string[] = [];
  const baseAdults = Math.min(adults, 2);
  if (baseAdults > 0) parts.push(`${baseAdults} adult${baseAdults === 1 ? '' : 's'}`);
  const extraAdults = adults - baseAdults;
  if (extraAdults > 0) {
    const pct = rate.additionalAdultPct ?? 100;
    parts.push(`${extraAdults} extra adult${extraAdults === 1 ? '' : 's'} @ ${pct}%`);
  }
  if (childCount > 0) {
    const pct = rate.additionalChildPct ?? 100;
    parts.push(`${childCount} child${childCount === 1 ? '' : 'ren'} @ ${pct}%`);
  }
  return parts.join(' + ');
}

export interface ParkFeeRate {
  parkId: string;
  parkName: string;
  seasonId: string | null;
  category: ParkFeeCategory;
  perPersonRate: number;
  // 'transit' = a reduced pass-through rate for driving through the park
  // without stopping to game-view. Undefined/'entrance' = the normal full
  // entrance fee. A day flagged `isTransit` prefers a 'transit' row for its
  // category/season and falls back to the entrance rate (with a warning) if
  // none is configured, so a missing transit rate never silently underprices.
  feeType?: 'entrance' | 'transit';
}

export type ParkAncillaryChargeBasis =
  | 'per_vehicle_per_day'
  | 'per_vehicle_once_per_visit'
  | 'per_person_per_day';

export interface ParkAncillaryFeeRate {
  parkId: string;
  parkName: string;
  seasonId: string | null;
  name: string;
  chargeBasis: ParkAncillaryChargeBasis;
  rate: number;
  // Only meaningful for chargeBasis 'per_person_per_day' (e.g. a concession
  // fee that differs by adult/child, mirroring ParkFeeRate.category). Null/
  // unset means the fee applies to every traveler at the same rate.
  category?: ParkFeeCategory | null;
  // When true, only nights whose accommodation is flagged insidePark (see
  // PricingInput.insideParkAccommodationIds) count toward this fee — e.g.
  // Tarangire/Manyara's hotel concession fee, which a Karatu-based lodge
  // day-tripping in should never be charged. Unset/false = unconditional
  // (today's behavior for Serengeti/NCA/Ndutu).
  requiresInsidePark?: boolean;
}

export interface VehicleRate {
  id: string;
  perDayRate: number;
  // Max travelers this vehicle seats. When set, computePricing derives the
  // minimum vehicle count a party actually needs and raises vehicleCount to
  // match if the caller's value is too low — see effectiveVehicleCount.
  // Null/unset = capacity unknown, no auto-bump (today's behavior).
  seatCapacity?: number | null;
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

// Per vehicle per day. A "touring" day is any day the guide is out with the
// group (game drives, transfers between camps, crater descents); "airport
// transfer" is a same-day pickup/dropoff leg with no touring — real cost
// sheets price that far lower ($10/day vs $35-60/day for a touring day).
export interface GuideRate {
  id: string;
  name: string;
  touringRate: number;
  airportTransferRate: number;
}

// A flat per-person meal cost (e.g. a boxed lunch on a relocation day with no
// lodge lunch available). No season — these are simple, small, fixed rates.
export interface MealRate {
  id: string;
  name: string;
  perPersonRate: number;
}

// A domestic/charter flight leg, priced per person. Shares the seasonal-row
// shape used by ActivityRate: multiple rows can share the same `id` (the
// route) with different seasonId values.
export interface FlightRate {
  id: string;
  name: string;
  seasonId: string | null;
  perPersonRate: number;
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
  // Calendar date for this day. Null when the trip has no start date yet —
  // every season-dependent lookup (accommodation, park fee, activity,
  // flight) then falls back to that item's highest-rate row across all its
  // seasons, so pricing still shows a conservative estimate instead of
  // blocking entirely (see pickHighestRate / the 'no_start_date' warning).
  date: Date | null;
  accommodationId: string | null;
  accommodationName?: string | null; // shown in the cost line label

  mealPlan: MealPlan | null;
  rooms: RoomNight[];
  parkId: string | null;
  destinationName?: string | null;
  activities?: DayActivityInput[];
  // 'touring' (default when unset) = a normal day out with the vehicle and
  // guide. 'airport_transfer' = a same-day pickup/dropoff leg only — drives
  // the lower guide-fee rate (see GuideRate). 'none' = no vehicle/guide cost
  // at all that day (e.g. a Zanzibar beach day on a mainland+beach trip).
  dayKind?: 'touring' | 'airport_transfer' | 'none';
  // True when this day passes through parkId without a full visit (e.g.
  // driving past Ngorongoro en route to the Serengeti). Looks up the park's
  // 'transit' feeType rate instead of the full entrance fee.
  isTransit?: boolean;
  // References MealRate.id when this day needs a boxed lunch. Null/unset =
  // no meal cost that day.
  mealCostId?: string | null;
  // References FlightRate.id when this day includes a domestic/charter
  // flight leg. Null/unset = no flight that day.
  flightId?: string | null;
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
  // Treated as a floor, not a fixed value — see effectiveVehicleCount.
  vehicleCount: number;
  // Guide assigned to the trip (one guide travels with each vehicle). Null/
  // unset = no guide line, matching today's behavior where guide cost was
  // assumed to already be folded into the vehicle's per-day rate.
  guideId?: string | null;
  guides?: GuideRate[];
  mealRates?: MealRate[];
  flightRates?: FlightRate[];
  pickupTransferId: string | null;
  dropoffTransferId: string | null;
  markupPct: number; // e.g. 30 => +30%
  // Optional group-size-tiered markup schedule. When set and non-empty, the
  // tier with the highest minPax <= pax wins; markupPct above is the
  // fallback for any pax count below every tier's minPax. Lets margin taper
  // (or grow) with group size instead of one flat percentage for every
  // booking.
  markupTiers?: Array<{ minPax: number; markupPct: number }> | null;
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
  // Accommodation ids flagged accommodations.isInsidePark = true — see
  // ParkAncillaryFeeRate.requiresInsidePark. Unset/empty = no accommodation
  // counts as inside-park, so any requiresInsidePark fee charges nothing
  // rather than silently falling back to the old unconditional behavior.
  insideParkAccommodationIds?: Set<string>;
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
  source:
    | 'accommodation'
    | 'park_fee'
    | 'activity'
    | 'vehicle'
    | 'transfer'
    | 'internal'
    | 'guide'
    | 'meal'
    | 'flight';
  missing?: string; // human-readable note if a rate could not be found
  // Set on occupant-slot-priced accommodation lines (see occupantSlotCost) when
  // the total isn't a flat perPaxRate * pax — i.e. extra-adult and/or child %s
  // actually applied — so the UI can show how the blended unitCost was made up.
  occupantBreakdown?: string;
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
  | 'missing_transfer'
  | 'vehicle_capacity_exceeded'
  | 'missing_guide'
  | 'unpriced_transfer_day'
  | 'missing_transit_fee'
  | 'missing_meal_rate'
  | 'missing_flight_rate'
  | 'no_start_date';

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

// No trip start date means no day can be resolved to a calendar season.
// Every date-null lookup below picks the highest-rate candidate instead of
// blocking — a conservative stand-in that's never an underprice, no matter
// which season a start date eventually lands on.
function pickHighestRate<T>(candidates: T[], valueOf: (t: T) => number): T | undefined {
  if (candidates.length === 0) return undefined;
  return candidates.reduce((best, c) => (valueOf(c) > valueOf(best) ? c : best));
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

const PROTECTED_AREA_RE =
  /\b(national\s+park|conservation\s+area|national\s+reserve|game\s+reserve)\b/i;

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

  if (input.days.some((d) => d.date === null)) {
    warnings.push({
      kind: 'no_start_date',
      message:
        "Trip start date not set — accommodation, park fee, activity, and flight lines are priced at each item's highest-season rate as a conservative estimate until a date is set",
    });
  }

  // Auto-bump vehicle count to fit the party when the selected vehicle's seat
  // capacity is known. vehicleCount from the caller is a floor, not a fixed
  // value — a group that outgrows one vehicle gets priced for a second one
  // automatically, instead of an operator having to remember to raise it (a
  // silent underprice otherwise: a forgotten vehicle also drops its driver,
  // guide, and per-vehicle park fees).
  const selectedVehicle = input.vehicleId
    ? input.vehicles.find((v) => v.id === input.vehicleId)
    : undefined;
  const effectiveVehicleCount =
    selectedVehicle?.seatCapacity && selectedVehicle.seatCapacity > 0
      ? Math.max(vehicleCount, Math.ceil(pax / selectedVehicle.seatCapacity))
      : vehicleCount;
  if (effectiveVehicleCount > vehicleCount) {
    warnings.push({
      kind: 'vehicle_capacity_exceeded',
      message: `${pax} travelers exceed ${vehicleCount} vehicle${vehicleCount === 1 ? '' : 's'} at ${selectedVehicle!.seatCapacity}-seat capacity — priced as ${effectiveVehicleCount} vehicles`,
    });
  }

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
    let season: SeasonBand | null = null;
    if (day.date !== null) {
      const accommodationSeasonIds = new Set(
        input.accommodationRates
          .filter((r) => r.accommodationId === day.accommodationId)
          .map((r) => r.seasonId),
      );
      season = resolveSeason(day.date, ownedSeasons(input.seasons, accommodationSeasonIds));
      if (!season) {
        warnings.push({
          kind: 'no_season',
          dayNumber: day.dayNumber,
          message: `${hotelName} (Day ${day.dayNumber}): no season matches ${day.date.toDateString()}`,
        });
        continue;
      }
    }
    for (const [roomIndex, room] of validRooms.entries()) {
      const roomKey = `acc:${day.accommodationId}:${day.dayNumber}:${room.roomType}:${day.mealPlan}:${roomIndex}`;
      const rate =
        day.date !== null
          ? input.accommodationRates.find(
              (r) =>
                r.accommodationId === day.accommodationId &&
                r.seasonId === season!.id &&
                r.roomType === room.roomType &&
                r.mealPlan === day.mealPlan,
            )
          : pickHighestRate(
              input.accommodationRates.filter(
                (r) =>
                  r.accommodationId === day.accommodationId &&
                  r.roomType === room.roomType &&
                  r.mealPlan === day.mealPlan,
              ),
              (r) => r.perPaxRate,
            );
      if (!rate) {
        warnings.push({
          kind: 'missing_hotel_rate',
          dayNumber: day.dayNumber,
          message: `${hotelName} (Day ${day.dayNumber}): no rate for ${room.roomType}/${day.mealPlan}${season ? ` in ${season.name}` : ''}`,
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
          occupantBreakdown: describeOccupantBreakdown(rate, room.pax, room.children ?? 0),
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

  // Parks with zero parkFeeRates rows at all (only an ancillary fee, e.g. a
  // crater-descent-only sub-feature) never charge an entrance fee — skip them
  // here rather than warning "no park fee for category X" on every day/segment
  // for a fee that was never meant to exist.
  const parksWithAnyFeeRate = new Set(input.parkFeeRates.map((r) => r.parkId));

  for (const { day, parkId } of daysWithParkId) {
    if (!parkId || !parksWithAnyFeeRate.has(parkId)) continue;
    const parkSeasonIds = new Set(
      input.parkFeeRates
        .filter(
          (r): r is ParkFeeRate & { seasonId: string } =>
            r.parkId === parkId && r.seasonId !== null,
        )
        .map((r) => r.seasonId),
    );
    const season =
      day.date !== null ? resolveSeason(day.date, ownedSeasons(input.seasons, parkSeasonIds)) : null;
    for (const segment of segments) {
      if (segment.count <= 0) continue;
      const matchesCategory = (r: ParkFeeRate) =>
        r.parkId === parkId && r.category === segment.category;
      const isTransitRate = (r: ParkFeeRate) => (r.feeType ?? 'entrance') === 'transit';
      const isEntranceRate = (r: ParkFeeRate) => (r.feeType ?? 'entrance') === 'entrance';

      // Transit days (driving through without a full game-viewing visit)
      // prefer a 'transit' feeType row for this category/season; if none is
      // configured, fall back to the full entrance rate rather than silently
      // charging nothing, and warn so the gap in the rate card is visible.
      let rate: ParkFeeRate | undefined;
      let usedEntranceFallback = false;
      if (day.date === null) {
        // No trip start date: skip season matching and take the highest-rate
        // row for this category/feeType across every season instead.
        if (day.isTransit) {
          rate = pickHighestRate(
            input.parkFeeRates.filter((r) => matchesCategory(r) && isTransitRate(r)),
            (r) => r.perPersonRate,
          );
          if (!rate) {
            rate = pickHighestRate(
              input.parkFeeRates.filter((r) => matchesCategory(r) && isEntranceRate(r)),
              (r) => r.perPersonRate,
            );
            usedEntranceFallback = !!rate;
          }
        } else {
          rate = pickHighestRate(
            input.parkFeeRates.filter((r) => matchesCategory(r) && isEntranceRate(r)),
            (r) => r.perPersonRate,
          );
        }
      } else if (day.isTransit) {
        rate =
          input.parkFeeRates.find(
            (r) => matchesCategory(r) && isTransitRate(r) && r.seasonId === (season?.id ?? null),
          ) ?? input.parkFeeRates.find((r) => matchesCategory(r) && isTransitRate(r) && r.seasonId === null);
        if (!rate) {
          rate =
            input.parkFeeRates.find(
              (r) => matchesCategory(r) && isEntranceRate(r) && r.seasonId === (season?.id ?? null),
            ) ??
            input.parkFeeRates.find((r) => matchesCategory(r) && isEntranceRate(r) && r.seasonId === null);
          usedEntranceFallback = !!rate;
        }
      } else {
        // park fees: season-specific row preferred, fall back to season-less (year-round)
        rate =
          input.parkFeeRates.find(
            (r) => matchesCategory(r) && isEntranceRate(r) && r.seasonId === (season?.id ?? null),
          ) ??
          input.parkFeeRates.find((r) => matchesCategory(r) && isEntranceRate(r) && r.seasonId === null);
      }
      if (!rate) {
        warnings.push({
          kind: 'missing_park_fee',
          dayNumber: day.dayNumber,
          message: `Day ${day.dayNumber}: no park fee for category ${segment.category}`,
        });
        continue;
      }
      if (usedEntranceFallback) {
        warnings.push({
          kind: 'missing_transit_fee',
          dayNumber: day.dayNumber,
          message: `Day ${day.dayNumber}: no transit rate configured for this park/category, charged the full entrance fee instead`,
        });
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
    const insideParkDayCountByPark = new Map<string, number>();
    const firstDayByPark = new Map<string, (typeof daysWithParkId)[number]>();
    const insideParkIds = input.insideParkAccommodationIds;
    for (const entry of daysWithParkId) {
      if (!entry.parkId) continue;
      dayCountByPark.set(entry.parkId, (dayCountByPark.get(entry.parkId) ?? 0) + 1);
      if (!firstDayByPark.has(entry.parkId)) firstDayByPark.set(entry.parkId, entry);
      if (entry.day.accommodationId && insideParkIds?.has(entry.day.accommodationId)) {
        insideParkDayCountByPark.set(entry.parkId, (insideParkDayCountByPark.get(entry.parkId) ?? 0) + 1);
      }
    }

    // A "visit" is a contiguous run of days at the same park — an itinerary
    // that loops back through a park later (e.g. Tarangire, then Ngorongoro,
    // then Tarangire again) counts as two visits, so a once-per-visit gate
    // fee (unlike a per-day fee) charges twice, not once for the whole trip.
    const visitCountByPark = new Map<string, number>();
    {
      const orderedEntries = [...daysWithParkId].sort((a, b) => a.day.dayNumber - b.day.dayNumber);
      let prevParkId: string | null = null;
      for (const entry of orderedEntries) {
        if (entry.parkId && entry.parkId !== prevParkId) {
          visitCountByPark.set(entry.parkId, (visitCountByPark.get(entry.parkId) ?? 0) + 1);
        }
        prevParkId = entry.parkId;
      }
    }

    // Group by (parkId, name, category) first — a single fee (e.g. a
    // concession fee that's genuinely higher Jul-Sep than Oct-Jun per
    // TANAPA's own tariff sheet) can have one row per season, same as every
    // other seasonal rate in this engine. Resolve each group to exactly one
    // row via the visit's first day (or the highest rate with no start
    // date) before pricing, so two seasonal rows for the same fee never
    // both charge on top of each other.
    const feesByIdentity = new Map<string, ParkAncillaryFeeRate[]>();
    for (const fee of input.parkAncillaryFees) {
      const identityKey = `${fee.parkId}::${fee.name}::${fee.category ?? ''}`;
      const list = feesByIdentity.get(identityKey) ?? [];
      list.push(fee);
      feesByIdentity.set(identityKey, list);
    }
    const feesByPark = new Map<string, ParkAncillaryFeeRate[]>();
    for (const feeGroup of feesByIdentity.values()) {
      const parkId = feeGroup[0]!.parkId;
      const ownedIds = new Set(
        feeGroup
          .filter((f): f is ParkAncillaryFeeRate & { seasonId: string } => f.seasonId !== null)
          .map((f) => f.seasonId),
      );
      const date = firstDayByPark.get(parkId)?.day.date ?? null;
      const season = date !== null ? resolveSeason(date, ownedSeasons(input.seasons, ownedIds)) : null;
      const selected =
        date !== null
          ? (feeGroup.find((f) => f.seasonId === (season?.id ?? null)) ??
            feeGroup.find((f) => f.seasonId === null))
          : pickHighestRate(feeGroup, (f) => f.rate);
      if (!selected) continue;
      const list = feesByPark.get(parkId) ?? [];
      list.push(selected);
      feesByPark.set(parkId, list);
    }

    for (const [parkId, dayCount] of dayCountByPark) {
      const fees = feesByPark.get(parkId);
      const firstFee = fees?.[0];
      if (!fees || !firstFee) continue;
      const firstEntry = firstDayByPark.get(parkId);
      if (!firstEntry) continue;

      // Per-person fees (e.g. concession) scale with headcount and don't
      // need a vehicle at all — only the per-vehicle bases require one.
      const vehicleFees = fees.filter((f) => f.chargeBasis !== 'per_person_per_day');
      const personFees = fees.filter((f) => f.chargeBasis === 'per_person_per_day');

      if (vehicleFees.length > 0 && !hasVehicle) {
        warnings.push({
          kind: 'missing_park_ancillary_no_vehicle',
          message: `${firstFee.parkName || 'Park'}: vehicle-based fees skipped (no vehicle selected)`,
        });
      }

      if (hasVehicle) {
        for (const fee of vehicleFees) {
          const occurrences =
            fee.chargeBasis === 'per_vehicle_per_day' ? dayCount : (visitCountByPark.get(parkId) ?? 1);
          const totalCost = num(fee.rate * occurrences * effectiveVehicleCount);
          const occurrenceLabel =
            fee.chargeBasis === 'per_vehicle_per_day'
              ? `${occurrences} day${occurrences === 1 ? '' : 's'}`
              : occurrences > 1
                ? `${occurrences} visits`
                : null;
          const vehicleLabel = effectiveVehicleCount > 1 ? `${effectiveVehicleCount} vehicles` : null;
          const suffix = [occurrenceLabel, vehicleLabel].filter(Boolean).join(' × ');
          lineItems.push({
            key: `park_ancillary:${parkId}:${fee.name}`,
            label: suffix
              ? `${fee.parkName || 'Park'} — ${fee.name} (${suffix})`
              : `${fee.parkName || 'Park'} — ${fee.name}`,
            dayNumber: firstEntry.day.dayNumber,
            quantity: occurrences * effectiveVehicleCount,
            unitCost: fee.rate,
            totalCost,
            source: 'park_fee',
          });
        }
      }

      for (const fee of personFees) {
        const segmentPax = fee.category
          ? (segments.find((s) => s.category === fee.category)?.count ?? 0)
          : pax;
        if (segmentPax <= 0) continue;
        const effectiveDayCount = fee.requiresInsidePark
          ? insideParkDayCountByPark.get(parkId) ?? 0
          : dayCount;
        if (effectiveDayCount <= 0) continue;
        const totalCost = num(fee.rate * effectiveDayCount * segmentPax);
        const categorySuffix = fee.category ? ` — ${parkCategoryLabel(fee.category)}` : '';
        lineItems.push({
          key: fee.category
            ? `park_ancillary:${parkId}:${fee.name}:${fee.category}`
            : `park_ancillary:${parkId}:${fee.name}`,
          label: `${fee.parkName || 'Park'} — ${fee.name}${categorySuffix} (${effectiveDayCount} day${effectiveDayCount === 1 ? '' : 's'} × ${segmentPax})`,
          dayNumber: firstEntry.day.dayNumber,
          quantity: effectiveDayCount * segmentPax,
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
          .filter(
            (r): r is ActivityRate & { seasonId: string } => matches(r) && r.seasonId !== null,
          )
          .map((r) => r.seasonId),
      );
      const season =
        day.date !== null
          ? resolveSeason(day.date, ownedSeasons(input.seasons, activitySeasonIds))
          : null;
      const rate =
        day.date !== null
          ? (input.activityRates.find((r) => matches(r) && r.seasonId === (season?.id ?? null)) ??
            input.activityRates.find((r) => matches(r) && r.seasonId === null))
          : pickHighestRate(input.activityRates.filter(matches), (r) => r.rate);
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

  // ---------- Meals (e.g. lunchbox on a relocation day, per day) ----------
  for (const day of input.days) {
    if (!day.mealCostId) continue;
    const meal = (input.mealRates ?? []).find((m) => m.id === day.mealCostId);
    const key = `meal:${day.mealCostId}:${day.dayNumber}`;
    if (!meal) {
      warnings.push({
        kind: 'missing_meal_rate',
        dayNumber: day.dayNumber,
        message: `Day ${day.dayNumber}: no rate for the selected meal cost`,
        key,
      });
      lineItems.push({
        key,
        label: `Meal (Day ${day.dayNumber})`,
        dayNumber: day.dayNumber,
        quantity: pax,
        unitCost: 0,
        totalCost: 0,
        source: 'meal',
        missing: 'rate not configured',
      });
      continue;
    }
    lineItems.push({
      key,
      label: `${meal.name} (Day ${day.dayNumber})`,
      dayNumber: day.dayNumber,
      quantity: pax,
      unitCost: meal.perPersonRate,
      totalCost: num(meal.perPersonRate * pax),
      source: 'meal',
    });
  }

  // ---------- Flights (domestic/charter legs, per day, per person) ----------
  for (const day of input.days) {
    if (!day.flightId) continue;
    const flightSeasonIds = new Set(
      (input.flightRates ?? [])
        .filter(
          (f): f is FlightRate & { seasonId: string } => f.id === day.flightId && f.seasonId !== null,
        )
        .map((f) => f.seasonId),
    );
    const season =
      day.date !== null
        ? resolveSeason(day.date, ownedSeasons(input.seasons, flightSeasonIds))
        : null;
    const flight =
      day.date !== null
        ? ((input.flightRates ?? []).find(
            (f) => f.id === day.flightId && f.seasonId === (season?.id ?? null),
          ) ?? (input.flightRates ?? []).find((f) => f.id === day.flightId && f.seasonId === null))
        : pickHighestRate(
            (input.flightRates ?? []).filter((f) => f.id === day.flightId),
            (f) => f.perPersonRate,
          );
    const key = `flight:${day.flightId}:${day.dayNumber}`;
    if (!flight) {
      warnings.push({
        kind: 'missing_flight_rate',
        dayNumber: day.dayNumber,
        message: `Day ${day.dayNumber}: no rate for the selected flight`,
        key,
      });
      lineItems.push({
        key,
        label: `Flight (Day ${day.dayNumber})`,
        dayNumber: day.dayNumber,
        quantity: pax,
        unitCost: 0,
        totalCost: 0,
        source: 'flight',
        missing: 'rate not configured',
      });
      continue;
    }
    lineItems.push({
      key,
      label: `${flight.name} (Day ${day.dayNumber})`,
      dayNumber: day.dayNumber,
      quantity: pax,
      unitCost: flight.perPersonRate,
      totalCost: num(flight.perPersonRate * pax),
      source: 'flight',
    });
  }

  // ---------- Vehicle (one line, all days the vehicle is actually used) ----------
  if (input.vehicleId) {
    const vehicle = input.vehicles.find((v) => v.id === input.vehicleId);
    if (!vehicle) {
      warnings.push({
        kind: 'missing_vehicle',
        message: 'Vehicle selected but rate not found',
      });
    } else {
      // Only 'touring' days use the main safari vehicle at its full per-day
      // rate. 'airport_transfer' days use a separate transfer fee instead
      // (pickup/dropoff), and 'none' days (e.g. a Zanzibar beach extension
      // tacked onto a mainland safari) use no vehicle at all — charging
      // every day of the whole trip regardless would overprice both.
      const vehicleDays = input.days.filter((d) => (d.dayKind ?? 'touring') === 'touring').length;
      const total = vehicle.perDayRate * vehicleDays * effectiveVehicleCount;
      lineItems.push({
        key: 'vehicle',
        label:
          effectiveVehicleCount > 1
            ? `Vehicle + driver + fuel (${vehicleDays} days × ${effectiveVehicleCount} vehicles)`
            : `Vehicle + driver + fuel (${vehicleDays} days)`,
        quantity: vehicleDays * effectiveVehicleCount,
        unitCost: vehicle.perDayRate,
        totalCost: num(total),
        source: 'vehicle',
      });
    }
  }

  // An 'airport_transfer' day carries no vehicle cost (see above). That's
  // fine when the leg is already priced another way — the trip-level pickup/
  // dropoff transfer rate (first/last day) or a per-day flight leg (e.g. the
  // hop to Zanzibar) — but with none of guide, transfer, or flight covering
  // it, the day would be priced at $0 with no trace of the gap. Warn per day
  // instead of silently dropping the cost.
  if (!input.guideId) {
    input.days.forEach((day, index) => {
      if (day.dayKind !== 'airport_transfer') return;
      if (day.flightId) return;
      const coveredByPickup = index === 0 && !!input.pickupTransferId;
      const coveredByDropoff = index === input.days.length - 1 && !!input.dropoffTransferId;
      if (coveredByPickup || coveredByDropoff) return;
      warnings.push({
        kind: 'unpriced_transfer_day',
        dayNumber: day.dayNumber,
        message: `Day ${day.dayNumber}: airport transfer day has no vehicle, guide, transfer, or flight cost — assign one to price it`,
      });
    });
  }

  // ---------- Guide (separate from the vehicle; rate varies by day kind) ----------
  if (input.guideId) {
    const guide = (input.guides ?? []).find((g) => g.id === input.guideId);
    if (!guide) {
      warnings.push({ kind: 'missing_guide', message: 'Guide selected but rate not found' });
    } else {
      const touringDays = input.days.filter((d) => (d.dayKind ?? 'touring') === 'touring').length;
      const transferDays = input.days.filter((d) => d.dayKind === 'airport_transfer').length;
      if (touringDays > 0) {
        lineItems.push({
          key: 'guide:touring',
          label: `Guide (${touringDays} touring day${touringDays === 1 ? '' : 's'})`,
          quantity: touringDays * effectiveVehicleCount,
          unitCost: guide.touringRate,
          totalCost: num(guide.touringRate * touringDays * effectiveVehicleCount),
          source: 'guide',
        });
      }
      if (transferDays > 0) {
        lineItems.push({
          key: 'guide:airport_transfer',
          label: `Guide (${transferDays} airport transfer day${transferDays === 1 ? '' : 's'})`,
          quantity: transferDays * effectiveVehicleCount,
          unitCost: guide.airportTransferRate,
          totalCost: num(guide.airportTransferRate * transferDays * effectiveVehicleCount),
          source: 'guide',
        });
      }
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
  // an extra transfer beyond pickup/dropoff). `quantity` (e.g. pax count)
  // defaults to 1 for rows saved before it existed, where `amount` was
  // already the flat total.
  for (const line of input.internalCostLines ?? []) {
    const quantity = line.quantity && line.quantity > 0 ? line.quantity : 1;
    lineItems.push({
      key: `internal:${line.id}`,
      label: line.label,
      quantity,
      unitCost: line.amount,
      totalCost: num(line.amount * quantity),
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
      // quantity is always a resolved number by this point (never undefined) —
      // multiply directly so a genuinely zero-quantity line (e.g. a vehicle
      // selected with a zero-day trip) still overrides to $0, not to `rate`.
      li.totalCost = num(li.quantity * rate);
      li.overridden = true;
      li.missing = undefined;
      overriddenKeys.add(li.key);
    }
  }
  const activeWarnings =
    overriddenKeys.size === 0
      ? warnings
      : warnings.filter((w) => !(w.key && overriddenKeys.has(w.key)));

  // ---------- Totals ----------
  const effectiveMarkupPct = (() => {
    const tiers = input.markupTiers;
    if (!tiers || tiers.length === 0) return markupPct;
    const eligible = tiers.filter((t) => pax >= t.minPax).sort((a, b) => b.minPax - a.minPax);
    return eligible[0]?.markupPct ?? markupPct;
  })();
  const costSubtotal = num(lineItems.reduce((sum, l) => sum + l.totalCost, 0));
  const markupAmount = num((costSubtotal * effectiveMarkupPct) / 100);
  const sellTotal = num(costSubtotal + markupAmount);
  const costPerPax = pax > 0 ? num(costSubtotal / pax) : 0;
  const sellPerPax = pax > 0 ? num(sellTotal / pax) : 0;

  return {
    currency,
    lineItems,
    costSubtotal,
    markupPct: effectiveMarkupPct,
    markupAmount,
    sellTotal,
    costPerPax,
    sellPerPax,
    pax,
    warnings: activeWarnings,
  };
}
