import { format, addDays } from 'date-fns';
import type {
  ItineraryData,
  Day as ThemeDay,
  DayActivity,
  Location,
  Accommodation,
  NationalParkInfo,
} from '@/types/itinerary-types';
import type { TravelerGroup, PricingRow, ExtraOption, BuilderDay } from '@/types/itinerary-types';
import type { Proposal } from '@repo/db/schema';

// GeoJSON data for different countries
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

const TANZANIA_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Tanzania' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [30.4, -1.0],
            [33.0, -1.0],
            [34.0, -3.0],
            [39.0, -4.5],
            [41.0, -10.5],
            [35.0, -11.5],
            [30.0, -8.0],
            [29.0, -4.5],
            [30.4, -1.0],
          ],
        ],
      },
    },
  ],
};

const BOTSWANA_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Botswana' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [22.0, -18.0],
            [25.0, -18.0],
            [26.0, -20.0],
            [29.0, -22.0],
            [28.0, -27.0],
            [25.0, -26.0],
            [20.0, -25.0],
            [20.0, -20.0],
            [22.0, -18.0],
          ],
        ],
      },
    },
  ],
};

// Map destinations to countries for geojson selection
function getCountryFromDestination(destination: string | null): string {
  if (!destination) return 'rwanda';
  const dest = destination.toLowerCase();
  if (dest.includes('tanzania') || dest.includes('serengeti') || dest.includes('kilimanjaro')) {
    return 'tanzania';
  }
  if (dest.includes('botswana') || dest.includes('okavango') || dest.includes('chobe')) {
    return 'botswana';
  }
  return 'rwanda';
}

function getGeoJsonForCountry(country: string) {
  switch (country) {
    case 'tanzania':
      return TANZANIA_GEOJSON;
    case 'botswana':
      return BOTSWANA_GEOJSON;
    default:
      return RWANDA_GEOJSON;
  }
}

function getMapConfigForCountry(country: string) {
  switch (country) {
    case 'tanzania':
      return { scale: 6000, rotate: [-35.5, 3.2, 0] };
    case 'botswana':
      return { scale: 10000, rotate: [-23.5, 19.0, 0] };
    default:
      return { scale: 40000, rotate: [-29.85, 1.7, 0] };
  }
}

// City coordinates lookup for start/end locations
const CITY_COORDINATES: Record<string, [number, number]> = {
  // Rwanda
  kigali: [30.0619, -1.9441],
  musanze: [29.6346, -1.4994],
  ruhengeri: [29.6346, -1.4994], // Same as Musanze (old name)
  gisenyi: [29.2567, -1.7042],
  rubavu: [29.2567, -1.7042], // Same as Gisenyi
  kibuye: [29.3478, -2.0606],
  karongi: [29.3478, -2.0606], // Same as Kibuye
  butare: [29.7375, -2.5967],
  huye: [29.7375, -2.5967], // Same as Butare
  nyungwe: [29.2500, -2.4833],
  akagera: [30.7500, -1.9167],
  // Tanzania
  arusha: [36.683, -3.367],
  'dar es salaam': [39.2833, -6.8],
  kilimanjaro: [37.3556, -3.0674],
  mwanza: [32.9, -2.5167],
  moshi: [37.3433, -3.35],
  karatu: [35.7667, -3.35],
  ngorongoro: [35.5833, -3.2],
  seronera: [34.8333, -2.45], // Serengeti central
  // Botswana
  maun: [23.4167, -19.9833],
  kasane: [25.1536, -17.7983],
  gaborone: [25.9201, -24.6282],
  // Kenya
  nairobi: [36.8219, -1.2921],
  mombasa: [39.6682, -4.0435],
  // Uganda
  entebbe: [32.4637, 0.0512],
  kampala: [32.5825, 0.3476],
};

// National Park coordinates lookup
const NATIONAL_PARK_COORDINATES: Record<string, [number, number]> = {
  // Rwanda
  volcanoes: [29.5350, -1.4580],
  'volcanoes national park': [29.5350, -1.4580],
  'parc national des volcans': [29.5350, -1.4580],
  nyungwe: [29.2500, -2.4833],
  'nyungwe forest': [29.2500, -2.4833],
  'nyungwe national park': [29.2500, -2.4833],
  akagera: [30.7500, -1.9167],
  'akagera national park': [30.7500, -1.9167],
  gishwati: [29.4167, -1.8833],
  'gishwati-mukura': [29.4167, -1.8833],
  // Tanzania
  serengeti: [34.8333, -2.3333],
  'serengeti national park': [34.8333, -2.3333],
  ngorongoro: [35.5833, -3.2],
  'ngorongoro crater': [35.5833, -3.2],
  'ngorongoro conservation area': [35.5833, -3.2],
  tarangire: [36.0167, -4.0167],
  'tarangire national park': [36.0167, -4.0167],
  'lake manyara': [35.8333, -3.5333],
  'lake manyara national park': [35.8333, -3.5333],
  kilimanjaro: [37.3556, -3.0674],
  'mount kilimanjaro': [37.3556, -3.0674],
  // Botswana
  chobe: [25.1500, -18.7667],
  'chobe national park': [25.1500, -18.7667],
  okavango: [22.5000, -19.0000],
  'okavango delta': [22.5000, -19.0000],
  moremi: [23.0000, -19.2500],
  'moremi game reserve': [23.0000, -19.2500],
  // Kenya
  'maasai mara': [35.1500, -1.5000],
  'masai mara': [35.1500, -1.5000],
  amboseli: [37.2500, -2.6500],
  'amboseli national park': [37.2500, -2.6500],
  // Uganda
  'bwindi impenetrable': [29.6667, -1.0500],
  bwindi: [29.6667, -1.0500],
  'queen elizabeth': [29.8833, 0.0167],
  'queen elizabeth national park': [29.8833, 0.0167],
  'murchison falls': [31.6833, 2.2667],
};

function getCityCoordinates(city: string | null): Location | undefined {
  if (!city) return undefined;
  const cityLower = city.toLowerCase().trim();

  // Try exact match first
  if (CITY_COORDINATES[cityLower]) {
    return { name: city, coordinates: CITY_COORDINATES[cityLower] };
  }

  // Try partial match
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (cityLower.includes(key) || key.includes(cityLower)) {
      return { name: city, coordinates: coords };
    }
  }

  return undefined;
}

function getParkCoordinates(parkName: string, fallbackCountry: string): [number, number] {
  const parkLower = parkName.toLowerCase().trim();

  // Try exact match first
  if (NATIONAL_PARK_COORDINATES[parkLower]) {
    return NATIONAL_PARK_COORDINATES[parkLower];
  }

  // Try partial match - look for key words in the park name
  for (const [key, coords] of Object.entries(NATIONAL_PARK_COORDINATES)) {
    if (parkLower.includes(key) || key.includes(parkLower)) {
      return coords;
    }
  }

  // Fallback to country default
  const countryDefaults: Record<string, [number, number]> = {
    rwanda: [30.0619, -1.9441],
    tanzania: [36.683, -3.367],
    botswana: [23.41, -19.98],
    kenya: [36.8219, -1.2921],
    uganda: [32.5825, 0.3476],
  };

  const defaultCoord: [number, number] = [30.0619, -1.9441]; // Kigali fallback
  return countryDefaults[fallbackCountry] ?? defaultCoord;
}

// Convert builder activity to theme activity
function convertActivity(builderActivity: BuilderDay['activities'][0], index: number): DayActivity {
  const momentToTime: Record<string, string> = {
    Morning: '08:00',
    Afternoon: '14:00',
    Evening: '18:00',
    'Half Day': '09:00',
    'Full Day': '08:00',
    Night: '20:00',
  };

  return {
    time: momentToTime[builderActivity.moment] || `${8 + index}:00`,
    activity: builderActivity.name,
    description: builderActivity.description || '',
    location: builderActivity.location || undefined,
  };
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

export async function transformProposalToItineraryData(
  proposal: Proposal & {
    organization?: {
      name: string;
      logoUrl: string | null;
      primaryColor: string | null;
    } | null;
    client?: {
      name: string;
    } | null;
    days?: Array<{
      id: string;
      dayNumber: number;
      title: string | null;
      description: string | null;
      previewImage?: string | null;
      nationalPark?: {
        id: string;
        name: string;
        park_overview: Array<{ title?: string; name?: string; description: string }> | null;
        overview_page_id: string | null;
      } | null;
      accommodations?: Array<{
        accommodation: {
          id: string;
          name: string;
          overview: string | null;
          images?: Array<{ imageUrl: string }>;
        };
      }>;
      activities?: Array<{
        id: string;
        name: string;
        description: string | null;
        location: string | null;
        moment: string;
        time: string | null;
        imageUrl: string | null;
      }>;
      meals?: {
        breakfast: boolean;
        lunch: boolean;
        dinner: boolean;
      } | null;
    }>;
  },
): Promise<ItineraryData> {
  const proposalDays = proposal.days || [];
  const startDate = proposal.startDate ? new Date(proposal.startDate) : undefined;
  const travelerGroups: TravelerGroup[] = (proposal.travelerGroups as any) || [];
  const pricingRows: PricingRow[] = (proposal.pricingRows as any) || [];
  const extras: ExtraOption[] = (proposal.extras as any) || [];
  const inclusions: string[] = proposal.inclusions || [];
  const exclusions: string[] = proposal.exclusions || [];
  const tourTitle = proposal.tourTitle || proposal.name || 'Safari Adventure';
  const clientName = proposal.client?.name || '';

  // Determine country/location from first day's national park or title
  const firstDay = proposalDays[0];
  const firstPark = firstDay?.nationalPark;
  const firstDestination = firstPark?.name || firstDay?.title || 'Rwanda';
  const country = getCountryFromDestination(firstDestination);
  const location = firstDestination.includes('National Park')
    ? firstDestination
    : firstDestination.includes('Rwanda') || country === 'rwanda'
      ? 'Rwanda'
      : firstDestination;

  // Helper to sanitize IDs from location
  const sanitizeLocation = (loc: string | null | undefined): string | undefined => {
    if (!loc) return undefined;
    // Check if it looks like a UUID (standard format: 8-4-4-4-12 hex chars)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(loc)) return undefined;
    // Also check for long hex strings or database IDs
    if (loc.length > 20 && /^[a-z0-9-]+$/i.test(loc) && loc.includes('-')) return undefined;
    return loc;
  }

  // Convert days from relational data
  const itinerary: ThemeDay[] = proposalDays.map((day, index) => {
    const currentDate = startDate ? addDays(startDate, index) : new Date();
    const dateStr = format(currentDate, 'MMMM d, yyyy');

    // Convert activities
    const activities: DayActivity[] = (day.activities || []).map((act) => {
      const momentToTime: Record<string, string> = {
        Morning: '08:00',
        Afternoon: '14:00',
        Evening: '18:00',
        'Half Day': '09:00',
        'Full Day': '08:00',
        Night: '20:00',
      };

      return {
        time: act.time || momentToTime[act.moment] || '09:00',
        activity: act.name,
        description: act.description || '',
        location: sanitizeLocation(act.location),
      };
    });

    // Generate title from national park, day title, or first activity
    let title = day.title || '';
    if (!title && day.nationalPark) {
      title = `${day.nationalPark.name} National Park`;
    }
    if (!title && activities.length > 0 && activities[0]) {
      title = activities[0].activity;
    }
    if (!title) {
      title = `Day ${day.dayNumber}`;
    }

    // Get accommodation
    const accommodation = day.accommodations?.[0]?.accommodation;
    // Check if this is the last day
    const isLastDay = index === proposalDays.length - 1;
    const accommodationName =
      accommodation?.name || (isLastDay ? 'Last day, no accommodation' : 'To be confirmed');

    // Get meals
    const meals = day.meals;
    const mealsStr = meals
      ? [
          meals.breakfast ? 'Breakfast' : null,
          meals.lunch ? 'Lunch' : null,
          meals.dinner ? 'Dinner' : null,
        ]
          .filter(Boolean)
          .join(', ') || 'None'
      : 'None';

    return {
      day: day.dayNumber,
      date: dateStr,
      title,
      description: day.description || undefined,
      destination: day.nationalPark?.name || day.title || undefined,
      nationalParkId: day.nationalPark?.id,
      activities,
      accommodation: accommodationName,
      meals: mealsStr,
      previewImage: day.previewImage || undefined,
    };
  });

  // Extract accommodations from relational data
  const accommodationMap = new Map<string, Accommodation>();
  proposalDays.forEach((day) => {
    day.accommodations?.forEach(({ accommodation }) => {
      if (!accommodationMap.has(accommodation.id)) {
        const firstImage = accommodation.images?.[0]?.imageUrl;
        accommodationMap.set(accommodation.id, {
          id: accommodation.id,
          name: accommodation.name,
          image:
            firstImage ||
            'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2670&auto=format&fit=crop',
          description:
            accommodation.overview ||
            `Luxury accommodation in ${day.nationalPark?.name || 'Rwanda'}`,
          location: day.nationalPark?.name || 'Rwanda',
        });
      }
    });
  });
  const accommodations = Array.from(accommodationMap.values());

  // Generate map data from national parks
  const mapLocations: Location[] = [];
  const seenParks = new Set<string>();

  proposalDays.forEach((day) => {
    if (day.nationalPark && !seenParks.has(day.nationalPark.id)) {
      seenParks.add(day.nationalPark.id);
      // Get actual coordinates for this park using the lookup
      const coords = getParkCoordinates(day.nationalPark.name, country);
      mapLocations.push({
        name: day.nationalPark.name,
        coordinates: coords,
      });
    }
  });

  // If no locations found, provide a default based on country
  if (mapLocations.length === 0) {
    const defaultLocations: Record<string, Location> = {
      rwanda: {
        name: 'Kigali',
        coordinates: [30.0619, -1.9441],
      },
      tanzania: {
        name: 'Arusha',
        coordinates: [36.683, -3.367],
      },
      botswana: {
        name: 'Maun',
        coordinates: [23.41, -19.98],
      },
    };
    const defaultLoc = defaultLocations[country] || defaultLocations['rwanda'];
    if (defaultLoc) {
      mapLocations.push(defaultLoc);
    }
  }

  const geoJson = getGeoJsonForCountry(country);
  const mapConfig = getMapConfigForCountry(country);

  // Fetch pages for featured images (needed for hero image and park images)
  const pageIds = new Set<string>();
  proposalDays.forEach((day) => {
    if (day.nationalPark?.overview_page_id) {
      pageIds.add(day.nationalPark.overview_page_id);
    }
  });

  const pagesMap = new Map<string, string | null>();
  if (pageIds.size > 0) {
    const { db } = await import('@repo/db');
    const { pages } = await import('@repo/db/schema');
    const { inArray } = await import('drizzle-orm');

    const pagesData = await db
      .select({
        id: pages.id,
        featured_image_url: pages.featured_image_url,
      })
      .from(pages)
      .where(inArray(pages.id, Array.from(pageIds)));

    pagesData.forEach((page) => {
      pagesMap.set(page.id, page.featured_image_url);
    });
  }

  // Get hero image: first from saved proposal, then from first national park's page, or default
  let heroImage =
    'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=2000&auto=format&fit=crop';

  // Use saved hero image from proposal if available
  if (proposal.heroImage) {
    heroImage = proposal.heroImage;
  } else if (firstPark?.overview_page_id) {
    const featuredImage = pagesMap.get(firstPark.overview_page_id);
    if (featuredImage) {
      heroImage = featuredImage;
    }
  }

  // Calculate pricing
  const pricing = calculatePricing(pricingRows, extras, travelerGroups);

  // Generate subtitle
  const duration = `${proposalDays.length} Days`;
  const subtitle = `${duration} ${tourTitle.includes('Gorilla') ? 'Gorilla Trekking Safari' : 'Safari Adventure'}`;

  // Build national parks map from relational data - key by park ID for direct matching
  const nationalParksMap: Record<string, NationalParkInfo> = {};

  proposalDays.forEach((day) => {
    if (day.nationalPark) {
      const park = day.nationalPark;

      // Get featured image from page if available
      let featuredImageUrl: string | null = null;
      if (park.overview_page_id) {
        featuredImageUrl = pagesMap.get(park.overview_page_id) || null;
      }

      const parkData: NationalParkInfo = {
        id: park.id,
        name: park.name,
        park_overview: park.park_overview as any,
        featured_image_url: featuredImageUrl,
      };

      // Store by park ID (primary key) and also by name variations for fallback matching
      nationalParksMap[park.id] = parkData;

      // Also store by name variations for backward compatibility
      const parkNameLower = park.name.toLowerCase();
      const parkNameShort = parkNameLower.replace(/\s+national\s+park/i, '').trim();
      nationalParksMap[parkNameLower] = parkData;
      nationalParksMap[parkNameShort] = parkData;
      nationalParksMap[parkNameShort + '-np'] = parkData;
    }
  });

  return {
    id: proposal.id,
    title: tourTitle,
    subtitle: subtitle,
    clientName: clientName,
    duration,
    location,
    heroImage,
    theme: (proposal.theme as any) || 'minimalistic',
    organization: proposal.organization
      ? {
          name: proposal.organization.name,
          logoUrl: proposal.organization.logoUrl,
          primaryColor: proposal.organization.primaryColor,
        }
      : undefined,
    itinerary,
    accommodations,
    nationalParks: Object.keys(nationalParksMap).length > 0 ? nationalParksMap : undefined,
    pricing,
    includedItems: inclusions,
    excludedItems: exclusions,
    importantNotes: {
      description:
        'This itinerary has been carefully curated to offer you the best experience. Please review all details and contact us with any questions.',
      points: [
        'Prices are subject to availability',
        'Booking confirmation required',
        'Travel insurance recommended',
      ],
    },
    mapData: {
      geojson: geoJson,
      locations: mapLocations,
      scale: mapConfig.scale,
      rotate: mapConfig.rotate as [number, number, number],
      startLocation: getCityCoordinates(proposal.startCity),
      endLocation: getCityCoordinates(proposal.endCity),
    },
  };
}
