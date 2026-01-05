import { format, addDays } from 'date-fns';
import type {
  ItineraryData,
  Day as ThemeDay,
  DayActivity,
  Location,
  Accommodation,
  ThemeType,
  BuilderDay,
  TravelerGroup,
  PricingRow,
  ExtraOption,
} from '@/types/itinerary-types';

// GeoJSON data for Rwanda (default)
const RWANDA_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Rwanda' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [29.3399, -1.2132],
            [29.5833, -1.4333],
            [30.15, -1.05],
            [30.4, -1.1],
            [30.85, -1.35],
            [30.7, -2.15],
            [30.8, -2.35],
            [30.45, -2.4],
            [29.9, -2.35],
            [29.6, -2.85],
            [29.0, -2.7],
            [28.85, -2.4],
            [29.3, -1.8],
            [29.25, -1.55],
            [29.3399, -1.2132],
          ],
        ],
      },
    },
  ],
};

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
  nationalParksMap: Record<string, { id: string; name: string }>;
  accommodationsMap: Record<string, { id: string; name: string; image?: string; description?: string }>;
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
    nationalParksMap,
    accommodationsMap,
  } = params;

  // Convert builder days to theme days
  const itinerary: ThemeDay[] = days.map((day, index) => {
    const currentDate = startDate ? addDays(startDate, index) : new Date();
    const dateStr = format(currentDate, 'MMMM d, yyyy');

    // Convert activities
    const activities: DayActivity[] = day.activities.map((act, actIndex) => {
      const momentToTime: Record<string, string> = {
        Morning: '08:00',
        Afternoon: '14:00',
        Evening: '18:00',
        'Half Day': '09:00',
        'Full Day': '08:00',
        Night: '20:00',
      };

      return {
        time: momentToTime[act.moment] || `${8 + actIndex}:00`,
        activity: act.name,
        description: act.description || '',
        location: act.location || undefined,
      };
    });

    // Get destination name from map
    const destinationData = day.destination ? nationalParksMap[day.destination] : null;
    const destinationName = destinationData?.name || day.destination || '';

    // Generate title
    let title = destinationName
      ? `Explore ${destinationName}`
      : day.activities[0]?.name || `Day ${day.dayNumber}`;

    // Get accommodation name from map
    const accommodationData = day.accommodation ? accommodationsMap[day.accommodation] : null;
    const isLastDay = index === days.length - 1;
    const accommodationName =
      accommodationData?.name || day.accommodation || (isLastDay ? 'Last day, no accommodation' : 'To be confirmed');

    // Get meals string
    const mealsStr = [
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
        accommodationsList.push({
          id: accData.id,
          name: accData.name,
          image: accData.image || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2670&auto=format&fit=crop',
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
    if (d.includes('tanzania') || d.includes('serengeti') || d.includes('kilimanjaro')) return 'tanzania';
    if (d.includes('botswana') || d.includes('okavango') || d.includes('chobe')) return 'botswana';
    return 'rwanda';
  };
  
  const country = getCountryFromDestination(firstDestination || tourTitle);
  const location = country === 'rwanda' ? 'Rwanda' : firstDestination || 'Rwanda';

  days.forEach((day) => {
    if (day.destination && !seenParks.has(day.destination)) {
      seenParks.add(day.destination);
      const parkData = nationalParksMap[day.destination];
      if (parkData) {
        // Use default Rwanda coordinates for now
        mapLocations.push({
          name: parkData.name,
          coordinates: [30.0619, -1.9441],
        });
      }
    }
  });

  if (mapLocations.length === 0) {
    mapLocations.push({
      name: 'Kigali',
      coordinates: [30.0619, -1.9441],
    });
  }

  const duration = `${days.length} Days`;

  return {
    id: 'preview',
    title: tourTitle || 'Safari Adventure',
    subtitle: `${duration} Safari Adventure`,
    clientName, // Pass client name
    duration,
    location,
    heroImage,
    theme: selectedTheme,
    itinerary,
    accommodations: accommodationsList,
    pricing,
    includedItems: inclusions,
    excludedItems: exclusions,
    importantNotes: {
      description:
        'This itinerary has been carefully curated to offer you the best experience.',
      points: [
        'Prices are subject to availability',
        'Booking confirmation required',
        'Travel insurance recommended',
      ],
    },
    mapData: {
      geojson: RWANDA_GEOJSON, // Ideally switch based on country like proposal-transform
      locations: mapLocations,
      scale: 40000,
      rotate: [-29.85, 1.7, 0],
    },
  };
}
