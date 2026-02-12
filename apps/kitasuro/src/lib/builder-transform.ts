import { addDays, format } from 'date-fns';
import type {
  Accommodation,
  BuilderDay,
  Day as ThemeDay,
  DayActivity,
  ExtraOption,
  ItineraryData,
  Location,
  NationalParkInfo,
  OrganizationInfo,
  PricingRow,
  ThemeTransportation,
  ThemeType,
  TransportModeType,
  TravelerGroup,
  TripOverview,
} from '@/types/itinerary-types';
import { capitalize } from '@/lib/utils';
import { CITIES } from '@/lib/data/cities';

// Transport mode labels
const transportModeLabels: Record<TransportModeType, string> = {
  road_4x4: '4WD Safari Vehicle',
  road_shuttle: 'Shuttle/Minibus',
  road_bus: 'Coach Bus',
  flight_domestic: 'Domestic Flight',
  flight_bush: 'Bush/Charter Flight',
};

function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

// Calculate pricing
function calculatePricing(
  pricingRows: PricingRow[],
  extras: ExtraOption[],
  travelerGroups: TravelerGroup[],
): ItineraryData['pricing'] {
  const totalPrice =
    pricingRows.reduce((acc, row) => acc + row.unitPrice * row.count, 0) +
    extras.filter((e) => e.selected).reduce((acc, e) => acc + e.price, 0);

  const totalTravelers = travelerGroups.reduce((acc, g) => acc + g.count, 0);
  const perPerson = totalTravelers > 0 ? totalPrice / totalTravelers : 0;

  return {
    total: `$${Math.round(totalPrice).toLocaleString()}`,
    perPerson: `$${Math.round(perPerson).toLocaleString()}`,
    currency: 'USD',
  };
}

function getCityCoordinates(city: string | null): Location | undefined {
  if (!city) return undefined;
  const cityLower = city.toLowerCase().trim();

  // Try exact match by value first (value is lowercase like "kigali")
  const exactMatch = CITIES.find((c) => c.value === cityLower);
  if (exactMatch) {
    return {
      name: exactMatch.label,
      coordinates: exactMatch.coordinates,
    };
  }

  // Try match by label (case-insensitive)
  const labelMatch = CITIES.find((c) => c.label.toLowerCase() === cityLower);
  if (labelMatch) {
    return {
      name: labelMatch.label,
      coordinates: labelMatch.coordinates,
    };
  }

  // Try partial match
  const partialMatch = CITIES.find(
    (c) =>
      cityLower.includes(c.value) ||
      c.value.includes(cityLower) ||
      cityLower.includes(c.label.toLowerCase()) ||
      c.label.toLowerCase().includes(cityLower),
  );
  if (partialMatch) {
    return {
      name: partialMatch.label,
      coordinates: partialMatch.coordinates,
    };
  }

  return undefined;
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
  endCity?: string;
  tourType?: string;
  country?: string;
  nationalParksMap: Record<
    string,
    { id: string; name: string; latitude?: string | null; longitude?: string | null; park_overview?: Array<{ title?: string; name?: string; description: string }> | null }
  >;
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
    endCity,
    tourType,
    country: countryParam,
    nationalParksMap,
    accommodationsMap,
    organization,
  } = params;

  // Convert builder days to theme days
  const itinerary: ThemeDay[] = days.map((day, index) => {
    const currentDate = startDate ? addDays(startDate, index) : new Date();
    const dateStr = format(currentDate, 'MMMM d, yyyy');

    // Convert activities - use moment directly (Morning, Afternoon, etc.) instead of clock time
    const activities: DayActivity[] = day.activities.map((act) => {
      return {
        time: act.moment, // Keep as "Morning", "Afternoon", "Full Day", etc.
        activity: capitalize(act.name),
        description: act.description || '',
        location: act.location || undefined,
      };
    });

    // Get destination name only from a resolved national park
    const destinationData = day.destination ? nationalParksMap[day.destination] : null;
    const destinationName = destinationData?.name ? capitalize(destinationData.name) : '';

    // Use user-set title if defined, otherwise generate from destination/activity
    let title = day.title !== undefined
      ? day.title
      : (destinationName ? `Explore ${destinationName}` : '')
        || capitalize(day.activities[0]?.name || '')
        || `Day ${day.dayNumber}`;

    // Get accommodation name from map
    const accommodationData = day.accommodation ? accommodationsMap[day.accommodation] : null;
    const isLastDay = index === days.length - 1;
    const accommodationName =
      accommodationData?.name ||
      day.accommodation ||
      (isLastDay ? 'Last day, no accommodation' : 'To be confirmed');

    // Get meals string
    const mealsStr =
      [
        day.meals.breakfast ? 'Breakfast' : null,
        day.meals.lunch ? 'Lunch' : null,
        day.meals.dinner ? 'Dinner' : null,
      ]
        .filter(Boolean)
        .join(', ') || 'None';

    // Build per-day transportation
    const dayTransport = day.transfer
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
      nationalParkId: day.destination || undefined,
      activities,
      accommodation: accommodationName,
      meals: mealsStr,
      previewImage: day.previewImage || undefined,
      transportation: dayTransport,
    };
  });

  // Determine country/location from param or first day's national park
  const firstDay = days[0];
  const firstParkId = firstDay?.destination;
  const firstDestination = firstParkId ? nationalParksMap[firstParkId]?.name : null;

  const country = countryParam || (firstDestination ? firstDestination.toLowerCase() : tourTitle.toLowerCase());
  const countryDisplayName = country.charAt(0).toUpperCase() + country.slice(1).toLowerCase();
  const location = countryDisplayName;

  // Extract accommodations
  const accommodationsList: Accommodation[] = [];
  const seenAccommodations = new Set<string>();

  days.forEach((day) => {
    if (day.accommodation && !seenAccommodations.has(day.accommodation)) {
      seenAccommodations.add(day.accommodation);
      const accData = accommodationsMap[day.accommodation];
      if (accData) {
        const defaultImage =
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2670&auto=format&fit=crop';
        accommodationsList.push({
          id: accData.id,
          name: accData.name,
          image: accData.image || defaultImage,
          images: accData.images && accData.images.length > 0 ? accData.images : undefined,
          description: accData.description || 'Luxury accommodation',
          location: nationalParksMap[day.destination || '']?.name || countryDisplayName,
        });
      }
    }
  });

  // Calculate pricing
  const pricing = calculatePricing(pricingRows, extras, travelerGroups);

  // Generate map data (simplified for preview)
  const mapLocations: Location[] = [];
  const seenParks = new Set<string>();

  days.forEach((day) => {
    if (day.destination && !seenParks.has(day.destination)) {
      seenParks.add(day.destination);
      const parkData = nationalParksMap[day.destination];
      // All national parks must have coordinates in the database
      if (parkData?.longitude && parkData?.latitude) {
        mapLocations.push({
          name: parkData.name,
          coordinates: [parseFloat(parkData.longitude), parseFloat(parkData.latitude)],
        });
      }
    }
  });

  const duration = `${days.length} Days`;

  // Get start/end city locations
  const startLocation = getCityCoordinates(startCity || null);
  const endLocation = getCityCoordinates(endCity || null);

  // Build trip overview for theme display
  const totalTravelers = travelerGroups.reduce((acc, g) => acc + g.count, 0);

  // Get all unique destination names in order
  const destinationNames: string[] = [];
  const seenDestNames = new Set<string>();
  days.forEach((day) => {
    if (day.destination) {
      const parkData = nationalParksMap[day.destination];
      const rawName = parkData?.name || day.destination;
      const name = capitalize(rawName);
      if (!seenDestNames.has(name)) {
        seenDestNames.add(name);
        destinationNames.push(name);
      }
    }
  });

  // Get travel date range from itinerary
  const firstDayDate = itinerary[0]?.date;
  const lastDayDate = itinerary[itinerary.length - 1]?.date;

  const tripOverview: TripOverview = {
    tourType: tourType || undefined,
    country:
      countryParam ||
      (country === 'rwanda'
        ? 'Rwanda'
        : country === 'tanzania'
          ? 'Tanzania'
          : country === 'botswana'
            ? 'Botswana'
            : undefined),
    travelerCount: totalTravelers > 0 ? totalTravelers : undefined,
    travelDates:
      firstDayDate && lastDayDate ? { start: firstDayDate, end: lastDayDate } : undefined,
    startCity: startLocation?.name || startCity || undefined,
    endCity: endLocation?.name || endCity || undefined,
    destinations: destinationNames,
  };

  // Build national parks map for theme rendering (park info blocks)
  const themeNationalParks: Record<string, NationalParkInfo> = {};
  days.forEach((day) => {
    if (day.destination) {
      const parkData = nationalParksMap[day.destination];
      if (parkData && !themeNationalParks[parkData.id]) {
        const parkInfo: NationalParkInfo = {
          id: parkData.id,
          name: parkData.name,
          park_overview: (parkData.park_overview as any) || null,
          featured_image_url: null,
        };
        // Store by ID and name variations for matching
        themeNationalParks[parkData.id] = parkInfo;
        const parkNameLower = parkData.name.toLowerCase();
        const parkNameShort = parkNameLower.replace(/\s+national\s+park/i, '').trim();
        themeNationalParks[parkNameLower] = parkInfo;
        themeNationalParks[parkNameShort] = parkInfo;
        themeNationalParks[parkNameShort + '-np'] = parkInfo;
      }
    }
  });

  // Derive transportation from per-day transfers
  const transportation: ThemeTransportation[] = days
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
    clientName, // Pass client name
    duration,
    location,
    heroImage,
    theme: selectedTheme,
    organization,
    tripOverview,
    itinerary,
    accommodations: accommodationsList,
    nationalParks: Object.keys(themeNationalParks).length > 0 ? themeNationalParks : undefined,
    transportation: transportation.length > 0 ? transportation : undefined,
    pricing,
    includedItems: inclusions,
    excludedItems: exclusions,
    importantNotes: {
      description: 'This itinerary has been carefully curated to offer you the best experience.',
      points: [
        'Prices are subject to availability',
        'Booking confirmation required',
        'Travel insurance recommended',
      ],
    },
    mapData: {
      locations: mapLocations,
      startLocation,
      endLocation,
    },
  };
}
