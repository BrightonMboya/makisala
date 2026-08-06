import type {
  AccommodationAlternative,
  ExtraOption,
  ItineraryData,
  PricingRow,
  ThemeAccommodationAlternative,
  TransportModeType,
  TravelerGroup,
} from '@/types/itinerary-types';

const titleCaseWords = (s: string) =>
  s
    .split(/\s+/)
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : ''))
    .join(' ');

/** "Double Room · 2 pax, Single Room · 1 pax" — or null when no rooms set. */
function roomSummaryText(rooms: AccommodationAlternative['rooms']): string | undefined {
  if (!rooms || rooms.length === 0) return undefined;
  const parts = rooms
    .filter((r) => r.roomType || r.pax)
    .map((r) => `${r.roomType ? titleCaseWords(r.roomType) : 'Room'}${r.pax ? ` · ${r.pax} pax` : ''}`);
  return parts.length > 0 ? parts.join(', ') : undefined;
}

/** "Breakfast, Dinner" — or undefined when no board basis is set. */
function mealSummaryText(meals: AccommodationAlternative['meals']): string | undefined {
  if (!meals) return undefined;
  const parts = [
    meals.breakfast ? 'Breakfast' : null,
    meals.lunch ? 'Lunch' : null,
    meals.dinner ? 'Dinner' : null,
  ].filter(Boolean);
  return parts.length > 0 ? (parts.join(', ') as string) : undefined;
}

/**
 * Signed, formatted price delta, e.g. "−$200 per person" or "+$150".
 *
 * The unit comes from `priceBasis`, the same field the booking page bills on,
 * so the proposal and the checkout can never quote different units for the
 * same lodge. The old free-text `priceUnitLabel` is deliberately ignored: it
 * was display-only and routinely disagreed with what was charged.
 */
function priceDeltaLabel(alt: AccommodationAlternative): string | undefined {
  const amount = alt.additionalPrice;
  if (amount == null || amount === 0) return undefined;
  const sign = amount < 0 ? '−' : '+'; // real minus sign for display
  const abs = Math.abs(amount);
  const unit =
    alt.priceBasis === 'per_person'
      ? ' per person'
      : alt.priceBasis === 'per_room'
        ? ' per room'
        : '';
  return `${sign}$${abs.toLocaleString()}${unit}`;
}

/**
 * Turn stored accommodation alternatives into the client-facing shape rendered
 * by the themes and PDF. Skips alternatives flagged hide-in-quote or without a
 * lodge. `resolve` maps an accommodation id to its display name and photos. The
 * saved JSON usually carries the name (and, on the public proposal, injected
 * image URLs) already, so `resolve` is only a fallback used by the live builder
 * preview where the accommodation lookup map is on hand.
 */
export function toThemeAlternatives(
  alternatives: AccommodationAlternative[] | undefined | null,
  resolve?: (id: string) => { name?: string; images?: string[] } | undefined,
): ThemeAccommodationAlternative[] | undefined {
  if (!alternatives || alternatives.length === 0) return undefined;
  const out = alternatives
    .filter((alt) => !alt.hideInQuote && (alt.accommodation || alt.accommodationName))
    .map((alt) => {
      const resolved = alt.accommodation && resolve ? resolve(alt.accommodation) : undefined;
      const name = alt.accommodationName || resolved?.name || 'Alternative lodge';
      const images =
        alt.images && alt.images.length > 0 ? alt.images : resolved?.images;
      return {
        name,
        rooms: roomSummaryText(alt.rooms),
        meals: mealSummaryText(alt.meals),
        priceLabel: priceDeltaLabel(alt),
        images: images && images.length > 0 ? images : undefined,
      } satisfies ThemeAccommodationAlternative;
    });
  return out.length > 0 ? out : undefined;
}

export const transportModeLabels: Record<TransportModeType, string> = {
  road_4x4: '4WD Safari Vehicle',
  road_shuttle: 'Shuttle/Minibus',
  road_bus: 'Coach Bus',
  mini_bus: 'Mini Bus',
  flight_domestic: 'Domestic Flight',
  flight_bush: 'Bush/Charter Flight',
};

/**
 * An activity is treated as a road/air transfer when its name mentions
 * "transfer" (case-insensitive). Transfers show From/To fields instead of a
 * single location. The transport mode lives in the activity name itself
 * (e.g. "Transfer by road", "Guided game-drive transfer").
 */
export function isTransferActivity(name: string | null | undefined): boolean {
  return !!name && /transfer/i.test(name);
}

/**
 * Collapse a transfer activity's origin/destination into one display string
 * (e.g. "Arusha Airport → Gombe Hotel") for rendering as the activity location.
 */
export function formatTransferLocation(
  from: string | null | undefined,
  to: string | null | undefined,
): string | null {
  const f = from?.trim();
  const t = to?.trim();
  if (f && t) return `${f} → ${t}`;
  return f || t || null;
}

export function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

// An activity marked "Optional" in the day-by-day step, priced in the
// Pricing step. `price` numeric() comes back as a string from the DB; null
// means "on request" — quoted by the operator directly, not shown as $0.
export type ActivityOptionInput = {
  dayNumber: number;
  name: string;
  location?: string | null;
  price: number | string | null;
  priceUnit?: 'per_person' | 'per_group' | null;
};

export function calculatePricing(
  pricingRows: PricingRow[],
  extras: ExtraOption[],
  travelerGroups: TravelerGroup[],
  activityOptions: ActivityOptionInput[] = [],
): ItineraryData['pricing'] {
  // Extras are NOT rolled into the main safari total. They are surfaced
  // separately as optional add-ons the client can choose to add on top.
  const totalPrice = pricingRows.reduce((acc, row) => acc + row.unitPrice * row.count, 0);

  const totalTravelers = travelerGroups.reduce((acc, g) => acc + g.count, 0);
  const perPerson = totalTravelers > 0 ? totalPrice / totalTravelers : 0;

  const breakdown = pricingRows.map((row) => ({
    label: row.type,
    quantity: row.count,
    unitPrice: row.unitPrice,
    lineTotal: row.unitPrice * row.count,
  }));

  const optionalExtras = extras
    .filter((e) => e.name.trim())
    .map((e) => {
      const isFree = e.priceUnit === 'free';
      let unit: string | undefined;
      if (e.priceUnit === 'per_person') unit = 'per person';
      else if (e.priceUnit === 'per_group') unit = 'per group';
      else if (e.priceUnit === 'custom') unit = e.customUnitLabel?.trim() || undefined;
      // Legacy extras (no priceUnit) and free ones render without a suffix.
      return {
        label: e.name,
        price: isFree ? 'Free' : `$${Math.round(e.price).toLocaleString()}`,
        unit: isFree ? undefined : unit,
      };
    });

  // Activities marked optional in the day-by-day step, priced in the Pricing
  // step. A null price means the operator left it "on request" instead of
  // charging a set amount — quote it directly, don't show $0.
  const activityExtras = activityOptions
    .filter((a) => a.name.trim())
    .map((a) => {
      const price = a.price == null || a.price === '' ? null : Number(a.price);
      const label = `Day ${a.dayNumber}: ${a.name}${a.location ? `, ${a.location}` : ''}`;
      return {
        label,
        price: price == null || Number.isNaN(price) ? 'On request' : `$${Math.round(price).toLocaleString()}`,
        unit: price == null || Number.isNaN(price) ? undefined : a.priceUnit === 'per_group' ? 'per group' : 'per person',
      };
    });

  const allExtras = [...activityExtras, ...optionalExtras];

  return {
    total: `$${Math.round(totalPrice).toLocaleString()}`,
    perPerson: `$${Math.round(perPerson).toLocaleString()}`,
    currency: 'USD',
    breakdown: breakdown.length > 0 ? breakdown : undefined,
    extras: allExtras.length > 0 ? allExtras : undefined,
  };
}
