import { format, addDays } from 'date-fns';
import type {
  ItineraryData,
  Day as ThemeDay,
  DayActivity,
  Location,
  Accommodation,
  NationalParkInfo,
} from '@/types/itinerary-types';
import type { BuilderDay, TravelerGroup, PricingRow, ExtraOption } from '@/types/itinerary-types';
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
    days?: Array<{
      id: string;
      dayNumber: number;
      title: string | null;
      description: string | null;
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
  const clientName = proposal.clientName || '';

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
        location: act.location || undefined,
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

  // Default coordinates by country (TODO: Add coordinates to nationalParks schema)
  const defaultCoords: Record<string, [number, number]> = {
    rwanda: [30.0619, -1.9441], // Kigali
    tanzania: [36.683, -3.367], // Arusha
    botswana: [23.41, -19.98], // Maun
  };

  proposalDays.forEach((day) => {
    if (day.nationalPark && !seenParks.has(day.nationalPark.id)) {
      seenParks.add(day.nationalPark.id);
      const coords = (defaultCoords[country] || defaultCoords['rwanda']) as [number, number];
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

  // Get hero image from first national park's page or default
  let heroImage =
    'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=2000&auto=format&fit=crop';
  if (firstPark?.overview_page_id) {
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
    duration,
    location,
    heroImage,
    theme: 'minimalistic', // Default theme, could be configurable
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
    },
  };
}
