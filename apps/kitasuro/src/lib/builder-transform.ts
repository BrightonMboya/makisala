import { addDays, format } from 'date-fns';
import type {
  Accommodation,
  BuilderDay,
  Day as ThemeDay,
  DayActivity,
  ExtraOption,
  ItineraryData,
  Location,
  PricingRow,
  ThemeType,
  TravelerGroup,
  TripOverview,
} from '@/types/itinerary-types';
import { capitalize } from '@/lib/utils';
import { CITIES } from '@/lib/data/cities';

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
    { id: string; name: string; latitude?: string | null; longitude?: string | null }
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

    // Get destination name from map and capitalize it
    const destinationData = day.destination ? nationalParksMap[day.destination] : null;
    const destinationName = capitalize(destinationData?.name || day.destination || '');

    // Generate title with properly capitalized destination
    let title = destinationName
      ? `Explore ${destinationName}`
      : capitalize(day.activities[0]?.name || '') || `Day ${day.dayNumber}`;

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
    };
  });

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
          location: nationalParksMap[day.destination || '']?.name || 'Rwanda',
        });
      }
    }
  });

  // Calculate pricing
  const pricing = calculatePricing(pricingRows, extras, travelerGroups);

  // Generate map data (simplified for preview)
  const mapLocations: Location[] = [];
  const seenParks = new Set<string>();

  // Determine country/location from first day's national park or title
  const firstDay = days[0];
  const firstParkId = firstDay?.destination;
  const firstDestination = firstParkId ? nationalParksMap[firstParkId]?.name : null;

  const getCountryFromDestination = (dest: string | null): string => {
    if (!dest) return 'rwanda';
    const d = dest.toLowerCase();
    if (d.includes('tanzania') || d.includes('serengeti') || d.includes('kilimanjaro'))
      return 'tanzania';
    if (d.includes('botswana') || d.includes('okavango') || d.includes('chobe')) return 'botswana';
    return 'rwanda';
  };

  const country = getCountryFromDestination(firstDestination || tourTitle);
  const location = country === 'rwanda' ? 'Rwanda' : firstDestination || 'Rwanda';

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

  return {
    id: 'preview',
    title: tourTitle || 'Safari Adventure',
    subtitle: `${duration} Safari Adventure`,
    clientName, // Pass client name
    duration,
    location,
    heroImage,
    theme: selectedTheme,
    tripOverview,
    itinerary,
    accommodations: accommodationsList,
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
