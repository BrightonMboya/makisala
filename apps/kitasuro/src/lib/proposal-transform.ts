import { addDays, format } from 'date-fns';
import type {
  Accommodation,
  Day as ThemeDay,
  DayActivity,
  ExtraOption,
  ItineraryData,
  Location,
  NationalParkInfo,
  PricingRow,
  ThemeTransportation,
  TransportModeType,
  TravelerGroup,
  TripOverview,
} from '@/types/itinerary-types';
import type { Proposal } from '@repo/db/schema';
import { CITIES } from '@/lib/data/cities';
import { getPublicUrl } from '@/lib/storage';
import { capitalize } from '@/lib/utils';

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

export async function transformProposalToItineraryData(
  proposal: Proposal & {
    organization?: {
      name: string;
      logoUrl: string | null;
      aboutDescription: string | null;
      paymentTerms: string | null;
    } | null;
    client?: {
      name: string;
    } | null;
    days?: Array<{
      // id: string;
      dayNumber: number;
      title: string | null;
      description: string | null;
      previewImage?: string | null;
      nationalPark?: {
        id: string;
        name: string;
        park_overview: Array<{ title?: string; name?: string; description: string }> | null;
        latitude: string | null;
        longitude: string | null;
      } | null;
      accommodations?: Array<{
        accommodation: {
          id: string;
          name: string;
          overview: string | null;
          description: string | null;
          images?: Array<{ bucket: string; key: string }>;
        };
      }>;
      activities?: Array<{
        name: string;
        description: string | null;
        location: string | null;
        moment: string;
        imageUrl: string | null;
      }>;
      meals?: {
        breakfast: boolean;
        lunch: boolean;
        dinner: boolean;
      } | null;
      transportation?: Array<{
        id: string;
        originName: string;
        destinationName: string;
        mode: TransportModeType;
        durationMinutes: number | null;
        distanceKm: number | null;
        notes: string | null;
      }>;
    }>;
    transportation?: Array<{
      id: string;
      originName: string;
      destinationName: string;
      mode: TransportModeType;
      durationMinutes: number | null;
      distanceKm: number | null;
      notes: string | null;
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

  // Determine location from countries array, tour country, or fallback
  const countries = proposal.countries?.filter(Boolean) || [];
  const tourCountry = (proposal as any).tour?.country;
  const location = countries.length > 0
    ? countries.map((c: string) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()).join(' & ')
    : tourCountry
      ? tourCountry.charAt(0).toUpperCase() + tourCountry.slice(1).toLowerCase()
      : 'East Africa';

  // Helper to sanitize IDs from location
  const sanitizeLocation = (loc: string | null | undefined): string | undefined => {
    if (!loc) return undefined;
    // Check if it looks like a UUID (standard format: 8-4-4-4-12 hex chars)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(loc)) return undefined;
    // Also check for long hex strings or database IDs
    if (loc.length > 20 && /^[a-z0-9-]+$/i.test(loc) && loc.includes('-')) return undefined;
    return loc;
  };

  // Convert days from relational data
  const itinerary: ThemeDay[] = proposalDays.map((day, index) => {
    const currentDate = startDate ? addDays(startDate, index) : new Date();
    const dateStr = format(currentDate, 'MMMM d, yyyy');

    // Convert activities - use moment directly (Morning, Afternoon, etc.)
    const activities: DayActivity[] = (day.activities || []).map((act) => {
      return {
        time: act.moment, // Keep as "Morning", "Afternoon", "Full Day", etc.
        activity: capitalize(act.name),
        description: act.description || '',
        location: sanitizeLocation(act.location),
      };
    });

    // Use stored title, or generate from destination/activity (same logic as builder-transform)
    const destinationName = day.nationalPark ? capitalize(day.nationalPark.name) : '';
    let title = day.title || '';
    if (!title || title === `Day ${day.dayNumber}`) {
      // Regenerate if title was never set or is just the default placeholder
      title = destinationName
        ? `Explore ${destinationName}`
        : (activities.length > 0 && activities[0] ? activities[0].activity : '')
          || `Day ${day.dayNumber}`;
    } else {
      title = capitalize(title);
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

    // Get per-day transportation
    const dayTransport = day.transportation?.[0];
    const themeTransport = dayTransport
      ? {
          id: dayTransport.id,
          originName: dayTransport.originName,
          destinationName: dayTransport.destinationName,
          mode: dayTransport.mode,
          modeLabel: transportModeLabels[dayTransport.mode] || dayTransport.mode,
          durationFormatted: formatDuration(dayTransport.durationMinutes),
          distanceKm: dayTransport.distanceKm,
          notes: dayTransport.notes,
        }
      : undefined;

    return {
      day: day.dayNumber,
      date: dateStr,
      title,
      description: day.description || undefined,
      destination: day.nationalPark?.name ? capitalize(day.nationalPark.name) : undefined,
      nationalParkId: day.nationalPark?.id,
      activities,
      accommodation: accommodationName,
      meals: mealsStr,
      previewImage: day.previewImage || undefined,
      transportation: themeTransport,
    };
  });

  // Extract accommodations from relational data
  const accommodationMap = new Map<string, Accommodation>();
  proposalDays.forEach((day) => {
    day.accommodations?.forEach(({ accommodation }) => {
      if (!accommodationMap.has(accommodation.id)) {
        // Get all images for carousel
        const allImages =
          accommodation.images?.map((img) => getPublicUrl(img.bucket, img.key)) || [];
        const firstImage = allImages[0];

        accommodationMap.set(accommodation.id, {
          id: accommodation.id,
          name: accommodation.name,
          image:
            firstImage ||
            'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2670&auto=format&fit=crop',
          images: allImages.length > 0 ? allImages : undefined,
          description:
            accommodation.overview ||
            `Luxury accommodation in ${day.nationalPark?.name || location}`,
          location: day.nationalPark?.name || location,
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
      // All national parks must have coordinates in the database
      if (day.nationalPark.latitude && day.nationalPark.longitude) {
        mapLocations.push({
          name: day.nationalPark.name,
          coordinates: [
            parseFloat(day.nationalPark.longitude),
            parseFloat(day.nationalPark.latitude),
          ],
        });
      }
    }
  });

  // Fetch pages for featured images (needed for hero image and park images)
  const pageIds = new Set<string>();

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

  // Build trip overview
  const totalTravelers = travelerGroups.reduce((acc, g) => acc + g.count, 0);

  // Get all unique destination names in order
  const destinationNames: string[] = [];
  const seenDestNames = new Set<string>();
  proposalDays.forEach((day) => {
    if (day.nationalPark) {
      const name = capitalize(day.nationalPark.name);
      if (!seenDestNames.has(name)) {
        seenDestNames.add(name);
        destinationNames.push(name);
      }
    }
  });

  // Get travel date range from itinerary
  const firstDayDate = itinerary[0]?.date;
  const lastDayDate = itinerary[itinerary.length - 1]?.date;

  const startLocation = getCityCoordinates(proposal.startCity);
  const endLocation = getCityCoordinates(proposal.endCity);

  const tripOverview: TripOverview = {
    tourType: (proposal as any).tourType || undefined,
    country: (proposal as any).country || undefined,
    travelerCount: totalTravelers > 0 ? totalTravelers : undefined,
    travelDates:
      firstDayDate && lastDayDate ? { start: firstDayDate, end: lastDayDate } : undefined,
    startCity: startLocation?.name || proposal.startCity || undefined,
    endCity: endLocation?.name || proposal.endCity || undefined,
    destinations: destinationNames,
  };

  // Derive transportation from per-day transfers
  const transportation: ThemeTransportation[] = proposalDays
    .filter((day) => day.transportation && day.transportation.length > 0)
    .map((day) => {
      const t = day.transportation![0]!;
      return {
        id: t.id,
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
          aboutDescription: proposal.organization.aboutDescription,
          paymentTerms: proposal.organization.paymentTerms,
        }
      : undefined,
    tripOverview,
    itinerary,
    accommodations,
    nationalParks: Object.keys(nationalParksMap).length > 0 ? nationalParksMap : undefined,
    transportation: transportation.length > 0 ? transportation : undefined,
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
      locations: mapLocations,
      startLocation,
      endLocation,
    },
  };
}
