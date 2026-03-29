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
  const totalPrice =
    pricingRows.reduce((acc, row) => acc + row.unitPrice * row.count, 0) +
    extras.filter((e) => e.selected).reduce((acc, e) => acc + e.price, 0);

  const totalTravelers = travelerGroups.reduce((acc, g) => acc + g.count, 0);
  const perPerson = totalTravelers > 0 ? totalPrice / totalTravelers : 0;

  const breakdown = [
    ...pricingRows.map((row) => ({
      label: row.type,
      quantity: row.count,
      unitPrice: row.unitPrice,
      lineTotal: row.unitPrice * row.count,
    })),
    ...extras
      .filter((e) => e.selected)
      .map((e) => ({
        label: e.name,
        quantity: 1,
        unitPrice: e.price,
        lineTotal: e.price,
      })),
  ];

  return {
    total: `$${Math.round(totalPrice).toLocaleString()}`,
    perPerson: `$${Math.round(perPerson).toLocaleString()}`,
    currency: 'USD',
    breakdown: breakdown.length > 0 ? breakdown : undefined,
  };
}
