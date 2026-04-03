import { addDays, format } from 'date-fns';
import type {
  Accommodation,
  BuilderDay,
  Day as ThemeDay,
  DayActivity,
  ExtraOption,
  ItineraryData,
  Location,
  OrganizationInfo,
  PricingRow,
  ThemeType,
  TravelerGroup,
  TripOverview,
} from '@/types/itinerary-types';
import { capitalize } from '@/lib/utils';
import { calculatePricing, formatDuration, transportModeLabels } from '@/lib/transform-utils';

/** Convert "08:00" or "14:30" to "8:00 AM" / "2:30 PM" */
function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (h == null || m == null || isNaN(h) || isNaN(m)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

// Transform builder context data to ItineraryData format (for preview page)
// This is a client-safe function that doesn't use database imports
export function transformBuilderToItineraryData(params: {
  days: BuilderDay[];
  startDate: Date | undefined;
  travelerGroups: TravelerGroup[];
  pricingRows: PricingRow[];
  extras: ExtraOption[];
  inclusions: string[];
  exclusions: string[];
  tourTitle: string;
  clientName: string;
  selectedTheme: ThemeType;
  heroImage: string;
  startCity?: string;
  startCityCoordinates?: [number, number] | null;
  endCity?: string;
  endCityCoordinates?: [number, number] | null;
  tourType?: string;
  country?: string;
  accommodationsMap: Record<
    string,
    {
      id: string;
      name: string;
      image?: string;
      images?: string[];
      description?: string;
    }
  >;
  hidePricing?: boolean;
  organization?: OrganizationInfo;
}): ItineraryData {
  const {
    days,
    startDate,
    travelerGroups,
    pricingRows,
    extras,
    inclusions,
    exclusions,
    tourTitle,
    clientName,
    selectedTheme,
    heroImage,
    startCity,
    startCityCoordinates,
    endCity,
    endCityCoordinates,
    tourType,
    country: countryParam,
    accommodationsMap,
    hidePricing,
    organization,
  } = params;

  // Convert builder days to theme days
  const itinerary: ThemeDay[] = days.map((day, index) => {
    const currentDate = startDate ? addDays(startDate, index) : new Date();
    const dateStr = format(currentDate, 'MMMM d, yyyy');

    const activities: DayActivity[] = day.activities.map((act) => ({
      time: act.startTime ? formatTime(act.startTime) : '',
      activity: capitalize(act.name),
      description: act.description || '',
      location: act.location || undefined,
    }));

    const destinationName = day.destinationName ? capitalize(day.destinationName) : '';

    const title =
      day.title !== undefined
        ? day.title
        : (destinationName ? `Explore ${destinationName}` : '') ||
          capitalize(day.activities[0]?.name || '') ||
          `Day ${day.dayNumber}`;

    const accommodationData = day.accommodation ? accommodationsMap[day.accommodation] : null;
    const isLastDay = index === days.length - 1;
    const accommodationName =
      accommodationData?.name ||
      day.accommodation ||
      (isLastDay ? 'Last day, no accommodation' : 'To be confirmed');

    const mealsStr =
      [
        day.meals.breakfast ? 'Breakfast' : null,
        day.meals.lunch ? 'Lunch' : null,
        day.meals.dinner ? 'Dinner' : null,
      ]
        .filter(Boolean)
        .join(', ') || 'None';

    const transportation = day.transfer
      ? {
          id: `transfer-day-${day.dayNumber}`,
          originName: day.transfer.originName,
          destinationName: day.transfer.destinationName,
          mode: day.transfer.mode,
          modeLabel: transportModeLabels[day.transfer.mode] || day.transfer.mode,
          durationFormatted: formatDuration(day.transfer.durationMinutes),
          distanceKm: day.transfer.distanceKm,
          notes: day.transfer.notes,
        }
      : undefined;

    return {
      day: day.dayNumber,
      date: dateStr,
      title,
      description: day.description || undefined,
      destination: destinationName || undefined,
      activities,
      accommodation: accommodationName,
      meals: mealsStr,
      previewImage: day.previewImage || undefined,
      transportation,
    };
  });

  const country = countryParam || tourTitle.toLowerCase();
  const countryDisplayName = country.charAt(0).toUpperCase() + country.slice(1).toLowerCase();
  const location = countryDisplayName;

  // Extract unique accommodations
  const accommodationsList: Accommodation[] = [];
  const seenAccommodations = new Set<string>();

  days.forEach((day) => {
    if (day.accommodation && !seenAccommodations.has(day.accommodation)) {
      seenAccommodations.add(day.accommodation);
      const accData = accommodationsMap[day.accommodation];
      if (accData) {
        accommodationsList.push({
          id: accData.id,
          name: accData.name,
          image:
            accData.image ||
            'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2670&auto=format&fit=crop',
          images: accData.images && accData.images.length > 0 ? accData.images : undefined,
          description: accData.description || 'Luxury accommodation',
          location: day.destinationName ? capitalize(day.destinationName) : countryDisplayName,
        });
      }
    }
  });

  const pricing = calculatePricing(pricingRows, extras, travelerGroups);

  // Generate map data
  const mapLocations: Location[] = [];
  const seenDestinations = new Set<string>();

  days.forEach((day) => {
    if (day.destination && !seenDestinations.has(day.destination)) {
      seenDestinations.add(day.destination);
      if (day.destinationLat != null && day.destinationLng != null) {
        mapLocations.push({
          name: day.destinationName || day.destination,
          coordinates: [day.destinationLng, day.destinationLat],
        });
      }
    }
  });

  const duration = `${days.length} Days`;

  const startLocation: Location | undefined = startCityCoordinates
    ? { name: startCity || 'Start', coordinates: startCityCoordinates }
    : undefined;
  const endLocation: Location | undefined = endCityCoordinates
    ? { name: endCity || 'End', coordinates: endCityCoordinates }
    : undefined;

  const totalTravelers = travelerGroups.reduce((acc, g) => acc + g.count, 0);

  // Unique destination names in order
  const destinationNames: string[] = [];
  const seenDestNames = new Set<string>();
  days.forEach((day) => {
    if (day.destinationName) {
      const name = capitalize(day.destinationName);
      if (!seenDestNames.has(name)) {
        seenDestNames.add(name);
        destinationNames.push(name);
      }
    }
  });

  const firstDayDate = itinerary[0]?.date;
  const lastDayDate = itinerary[itinerary.length - 1]?.date;

  const tripOverview: TripOverview = {
    tourType: tourType || undefined,
    country: countryParam,
    travelerCount: totalTravelers > 0 ? totalTravelers : undefined,
    travelDates:
      firstDayDate && lastDayDate ? { start: firstDayDate, end: lastDayDate } : undefined,
    startCity: startLocation?.name || startCity || undefined,
    endCity: endLocation?.name || endCity || undefined,
    destinations: destinationNames,
  };

  const transportation = days
    .filter((d) => d.transfer)
    .map((d) => {
      const t = d.transfer!;
      return {
        id: `transfer-day-${d.dayNumber}`,
        originName: t.originName,
        destinationName: t.destinationName,
        mode: t.mode,
        modeLabel: transportModeLabels[t.mode] || t.mode,
        durationFormatted: formatDuration(t.durationMinutes),
        distanceKm: t.distanceKm,
        notes: t.notes,
      };
    });

  return {
    id: 'preview',
    title: tourTitle || 'Safari Adventure',
    subtitle: `${duration} Safari Adventure`,
    clientName,
    duration,
    location,
    heroImage,
    theme: selectedTheme,
    organization,
    tripOverview,
    itinerary,
    accommodations: accommodationsList,
    transportation: transportation.length > 0 ? transportation : undefined,
    hidePricing,
    pricing,
    includedItems: inclusions,
    excludedItems: exclusions,
    mapData: {
      locations: mapLocations,
      startLocation,
      endLocation,
    },
  };
}
