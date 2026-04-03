import { addDays, format } from 'date-fns';
import type {
  Accommodation,
  Day as ThemeDay,
  DayActivity,
  ExtraOption,
  ItineraryData,
  Location,
  PricingRow,
  TransportModeType,
  TravelerGroup,
  TripOverview,
} from '@/types/itinerary-types';
import type { Proposal } from '@repo/db/schema';
import { getPublicUrl } from '@/lib/storage';
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

type ProposalDay = {
  dayNumber: number;
  title: string | null;
  description: string | null;
  previewImage?: string | null;
  destinationName?: string | null;
  destinationLat?: string | null;
  destinationLng?: string | null;
  nationalPark?: {
    id: string;
    name: string;
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
    startTime?: string | null;
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
};

type ProposalInput = Proposal & {
  organization?: {
    name: string;
    logoUrl: string | null;
    aboutDescription: string | null;
    paymentTerms: string | null;
  } | null;
  client?: { name: string } | null;
  days?: ProposalDay[];
};

/** Get the display name for a day's destination (legacy park relation or geo name). */
function getDayDestinationName(day: ProposalDay): string {
  if (day.nationalPark) return capitalize(day.nationalPark.name);
  if (day.destinationName) return capitalize(day.destinationName);
  return '';
}

export function transformProposalToItineraryData(proposal: ProposalInput): ItineraryData {
  const proposalDays = proposal.days || [];
  const startDate = proposal.startDate ? new Date(proposal.startDate) : undefined;
  const travelerGroups: TravelerGroup[] = (proposal.travelerGroups as any) || [];
  const pricingRows: PricingRow[] = (proposal.pricingRows as any) || [];
  const extras: ExtraOption[] = (proposal.extras as any) || [];
  const inclusions: string[] = proposal.inclusions || [];
  const exclusions: string[] = proposal.exclusions || [];
  const tourTitle = proposal.tourTitle || proposal.name || 'Safari Adventure';
  const clientName = proposal.client?.name || '';

  // Determine location from countries array or fallback
  const countries = proposal.countries?.filter(Boolean) || [];
  const location =
    countries.length > 0
      ? countries
          .map((c: string) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase())
          .join(' & ')
      : 'East Africa';

  // Convert days from relational data
  const itinerary: ThemeDay[] = proposalDays.map((day, index) => {
    const currentDate = startDate ? addDays(startDate, index) : new Date();
    const dateStr = format(currentDate, 'MMMM d, yyyy');

    const activities: DayActivity[] = (day.activities || []).map((act) => ({
      time: act.startTime ? formatTime(act.startTime) : '',
      activity: capitalize(act.name),
      description: act.description || '',
      location: act.location || undefined,
    }));

    const destinationName = getDayDestinationName(day);

    let title = day.title || '';
    if (!title || title === `Day ${day.dayNumber}`) {
      title = destinationName
        ? `Explore ${destinationName}`
        : (activities[0]?.activity || '') || `Day ${day.dayNumber}`;
    } else {
      title = capitalize(title);
    }

    const accommodation = day.accommodations?.[0]?.accommodation;
    const isLastDay = index === proposalDays.length - 1;
    const accommodationName =
      accommodation?.name || (isLastDay ? 'Last day, no accommodation' : 'To be confirmed');

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

    const dayTransport = day.transportation?.[0];
    const transportation = dayTransport
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
      destination: destinationName || undefined,
      activities,
      accommodation: accommodationName,
      meals: mealsStr,
      previewImage: day.previewImage || undefined,
      transportation,
    };
  });

  // Extract unique accommodations
  const accommodationMap = new Map<string, Accommodation>();
  proposalDays.forEach((day) => {
    const destName = getDayDestinationName(day) || location;
    day.accommodations?.forEach(({ accommodation }) => {
      if (!accommodationMap.has(accommodation.id)) {
        const allImages =
          accommodation.images?.map((img) => getPublicUrl(img.bucket, img.key)) || [];

        accommodationMap.set(accommodation.id, {
          id: accommodation.id,
          name: accommodation.name,
          image:
            allImages[0] ||
            'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2670&auto=format&fit=crop',
          images: allImages.length > 0 ? allImages : undefined,
          description: accommodation.overview || `Luxury accommodation in ${destName}`,
          location: destName,
        });
      }
    });
  });

  // Generate map data from destinations
  const mapLocations: Location[] = [];
  const seenDestinations = new Set<string>();

  proposalDays.forEach((day) => {
    if (day.nationalPark && !seenDestinations.has(day.nationalPark.id)) {
      seenDestinations.add(day.nationalPark.id);
      if (day.nationalPark.latitude && day.nationalPark.longitude) {
        mapLocations.push({
          name: day.nationalPark.name,
          coordinates: [
            parseFloat(day.nationalPark.longitude),
            parseFloat(day.nationalPark.latitude),
          ],
        });
      }
    } else if (!day.nationalPark && day.destinationLat && day.destinationLng) {
      const key = `${day.destinationLat},${day.destinationLng}`;
      if (!seenDestinations.has(key)) {
        seenDestinations.add(key);
        mapLocations.push({
          name: day.destinationName || 'Destination',
          coordinates: [parseFloat(day.destinationLng), parseFloat(day.destinationLat)],
        });
      }
    }
  });

  const heroImage = proposal.heroImage ||
    'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=2000&auto=format&fit=crop';

  const pricing = calculatePricing(pricingRows, extras, travelerGroups);

  const duration = `${proposalDays.length} Days`;

  const totalTravelers = travelerGroups.reduce((acc, g) => acc + g.count, 0);

  // Unique destination names in order
  const destinationNames: string[] = [];
  const seenDestNames = new Set<string>();
  proposalDays.forEach((day) => {
    const name = getDayDestinationName(day);
    if (name && !seenDestNames.has(name)) {
      seenDestNames.add(name);
      destinationNames.push(name);
    }
  });

  const firstDayDate = itinerary[0]?.date;
  const lastDayDate = itinerary[itinerary.length - 1]?.date;

  const startLocation: Location | undefined =
    proposal.startCityLat && proposal.startCityLng
      ? {
          name: proposal.startCity || 'Start',
          coordinates: [parseFloat(proposal.startCityLng), parseFloat(proposal.startCityLat)],
        }
      : undefined;
  const endLocation: Location | undefined =
    proposal.endCityLat && proposal.endCityLng
      ? {
          name: proposal.endCity || 'End',
          coordinates: [parseFloat(proposal.endCityLng), parseFloat(proposal.endCityLat)],
        }
      : undefined;

  const tripOverview: TripOverview = {
    tourType: proposal.tourType || undefined,
    country:
      countries.length > 0
        ? countries
            .map((c: string) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase())
            .join(' & ')
        : undefined,
    travelerCount: totalTravelers > 0 ? totalTravelers : undefined,
    travelDates:
      firstDayDate && lastDayDate ? { start: firstDayDate, end: lastDayDate } : undefined,
    startCity: startLocation?.name || proposal.startCity || undefined,
    endCity: endLocation?.name || proposal.endCity || undefined,
    destinations: destinationNames,
  };

  const transportation = proposalDays
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
    subtitle: `${duration} Safari Adventure`,
    clientName,
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
    accommodations: Array.from(accommodationMap.values()),
    transportation: transportation.length > 0 ? transportation : undefined,
    hidePricing: proposal.hidePricing || false,
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
