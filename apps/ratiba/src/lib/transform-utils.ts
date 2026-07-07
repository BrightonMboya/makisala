import type {
  ExtraOption,
  ItineraryData,
  PricingRow,
  TransportModeType,
  TravelerGroup,
} from '@/types/itinerary-types';

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

export function calculatePricing(
  pricingRows: PricingRow[],
  extras: ExtraOption[],
  travelerGroups: TravelerGroup[],
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
    .map((e) => ({
      label: e.name,
      price: `$${Math.round(e.price).toLocaleString()}`,
    }));

  return {
    total: `$${Math.round(totalPrice).toLocaleString()}`,
    perPerson: `$${Math.round(perPerson).toLocaleString()}`,
    currency: 'USD',
    breakdown: breakdown.length > 0 ? breakdown : undefined,
    extras: optionalExtras.length > 0 ? optionalExtras : undefined,
  };
}
