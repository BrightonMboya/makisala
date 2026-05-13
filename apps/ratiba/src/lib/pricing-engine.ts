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

export type RoomType = 'single' | 'double' | 'triple' | 'quad' | 'family';
export type MealPlan = 'ro' | 'bb' | 'hb' | 'fb' | 'ai';
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

export interface AccommodationRate {
  accommodationId: string;
  seasonId: string;
  roomType: RoomType;
  mealPlan: MealPlan;
  perPaxRate: number;
}

export interface ParkFeeRate {
  parkId: string;
  seasonId: string | null;
  category: ParkFeeCategory;
  perPersonRate: number;
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

export interface ItineraryDayInput {
  dayNumber: number;
  date: Date; // calendar date for this day
  accommodationId: string | null;
  roomType: RoomType | null;
  mealPlan: MealPlan | null;
  parkId: string | null;
}

export interface PricingInput {
  days: ItineraryDayInput[];
  pax: number; // total pax counted for park fees + hotel pax
  travelerCategory: ParkFeeCategory; // applied to every traveler in v1
  vehicleId: string | null;
  pickupTransferId: string | null;
  dropoffTransferId: string | null;
  markupPct: number; // e.g. 30 => +30%
  currency: string;

  // Rate-card data
  seasons: SeasonBand[];
  accommodationRates: AccommodationRate[];
  parkFeeRates: ParkFeeRate[];
  vehicles: VehicleRate[];
  transferRates: TransferRate[];
}

export interface LineItem {
  label: string;
  dayNumber?: number;
  quantity: number;
  unitCost: number;
  totalCost: number;
  source: 'accommodation' | 'park_fee' | 'vehicle' | 'transfer';
  missing?: string; // human-readable note if a rate could not be found
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
  warnings: string[]; // missing rates etc.
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

export function computePricing(input: PricingInput): PricingBreakdown {
  const { pax, markupPct, currency } = input;
  const warnings: string[] = [];
  const lineItems: LineItem[] = [];
  const tripDays = input.days.length;

  // ---------- Accommodation lines (per day) ----------
  for (const day of input.days) {
    if (!day.accommodationId) continue;
    if (!day.roomType || !day.mealPlan) {
      warnings.push(`Day ${day.dayNumber}: room type / meal plan not set, hotel cost skipped`);
      continue;
    }
    const season = resolveSeason(day.date, input.seasons);
    if (!season) {
      warnings.push(`Day ${day.dayNumber}: no season matches ${day.date.toDateString()}`);
      continue;
    }
    const rate = input.accommodationRates.find(
      (r) =>
        r.accommodationId === day.accommodationId &&
        r.seasonId === season.id &&
        r.roomType === day.roomType &&
        r.mealPlan === day.mealPlan,
    );
    if (!rate) {
      warnings.push(
        `Day ${day.dayNumber}: no accommodation rate for ${day.roomType}/${day.mealPlan}/${season.name}`,
      );
      lineItems.push({
        label: `Hotel night (Day ${day.dayNumber})`,
        dayNumber: day.dayNumber,
        quantity: pax,
        unitCost: 0,
        totalCost: 0,
        source: 'accommodation',
        missing: 'rate not configured',
      });
      continue;
    }
    lineItems.push({
      label: `Hotel night (Day ${day.dayNumber}) — ${day.roomType}/${day.mealPlan}`,
      dayNumber: day.dayNumber,
      quantity: pax,
      unitCost: rate.perPaxRate,
      totalCost: num(rate.perPaxRate * pax),
      source: 'accommodation',
    });
  }

  // ---------- Park fee lines (per day) ----------
  for (const day of input.days) {
    if (!day.parkId) continue;
    const season = resolveSeason(day.date, input.seasons);
    // park fees: season-specific row preferred, fall back to season-less (year-round)
    const rate =
      input.parkFeeRates.find(
        (r) =>
          r.parkId === day.parkId &&
          r.category === input.travelerCategory &&
          r.seasonId === (season?.id ?? null),
      ) ??
      input.parkFeeRates.find(
        (r) =>
          r.parkId === day.parkId &&
          r.category === input.travelerCategory &&
          r.seasonId === null,
      );
    if (!rate) {
      warnings.push(
        `Day ${day.dayNumber}: no park fee for category ${input.travelerCategory}`,
      );
      continue;
    }
    lineItems.push({
      label: `Park fee (Day ${day.dayNumber})`,
      dayNumber: day.dayNumber,
      quantity: pax,
      unitCost: rate.perPersonRate,
      totalCost: num(rate.perPersonRate * pax),
      source: 'park_fee',
    });
  }

  // ---------- Vehicle (one line, all days) ----------
  if (input.vehicleId) {
    const vehicle = input.vehicles.find((v) => v.id === input.vehicleId);
    if (!vehicle) {
      warnings.push('Vehicle selected but rate not found');
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
      warnings.push('Transfer selected but rate not found');
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
