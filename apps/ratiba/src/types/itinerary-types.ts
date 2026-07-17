import type React from 'react';

// ========== BUILDER TYPES (for form/state management) ==========
export type BuilderActivity = {
  id: string;
  libraryId?: string | null;
  name: string;
  location: string;
  // Transfer-type activities (name contains "transfer") use from/to instead of
  // `location`. Empty for regular activities.
  fromLocation?: string;
  toLocation?: string;
  // One or more moments, stored comma-separated e.g. "Morning" or "Morning, Afternoon".
  // Canonical values: Morning, Afternoon, Evening, Half Day, Full Day, Night.
  moment: string;
  startTime?: string | null; // Optional exact time e.g. "08:00", "14:30"
  isOptional: boolean;
  description?: string;
  imageUrl?: string;
};

export type RoomTypeOption = string;
export type MealPlanOption = 'ro' | 'bb' | 'hb' | 'fb';

// One room type on a night and how many travelers occupy it. A night can hold
// several of these (a "room mix"), e.g. 1 double (2 pax) + 1 family (3 pax).
export type RoomAllocation = {
  roomType: RoomTypeOption | null;
  pax: number;
};

// An alternative accommodation offered for a night: a lodge the client can pick
// instead of the primary one, with its own room mix and board basis. The lodge,
// rooms, and meals are configured in the day-by-day step; the price delta is set
// in the pricing step. `additionalPrice` is signed relative to the primary:
// negative = cheaper, positive = upgrade, 0/null = same price.
export type AccommodationAlternative = {
  id: string;
  accommodation: string | null; // accommodation id (UUID)
  accommodationName?: string | null; // cached name to avoid re-fetching
  rooms?: RoomAllocation[];
  meals?: { breakfast: boolean; lunch: boolean; dinner: boolean };
  mealOptions?: string[];
  // Resolved public image URLs for this lodge. Not stored in the builder JSON;
  // injected server-side (see proposals.getById) so the client proposal can show
  // the alternative's photos. In the builder preview they come from the
  // accommodations lookup map instead.
  images?: string[] | null;
  // --- Pricing (set on the pricing step) ---
  additionalPrice?: number | null;
  priceUnitLabel?: string | null; // free text, e.g. "per person / per night"
  hideInQuote?: boolean; // keep it in the builder but omit from the client quote
};

export type BuilderDay = {
  id: string;
  dayNumber: number;
  date: string;
  accommodation: string | null;
  accommodationName?: string | null; // Cached name to avoid re-fetching
  // Used by the pricing engine to pick the right hotel rate rows. Room type
  // varies per allocation; the board basis is derived from the meals toggles.
  rooms?: RoomAllocation[];
  // Alternative lodges offered for this night (see AccommodationAlternative).
  alternatives?: AccommodationAlternative[];
  destination: string | null;
  destinationName?: string | null; // Cached display name (for non-park destinations)
  destinationLat?: number | null;
  destinationLng?: number | null;
  activities: BuilderActivity[];
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  mealOptions?: string[];
  title?: string; // Editable day title for timeline
  description?: string; // Narrative for the day
  accommodationImage?: string;
  previewImage?: string; // Custom image for theme preview
  transfer?: {
    originId: string | null;
    originName: string;
    destinationId: string | null;
    destinationName: string;
    mode: TransportModeType;
    durationMinutes: number | null;
    distanceKm: number | null;
    notes: string;
  } | null;
};

export type TravelerType = 'Adult' | 'Senior' | 'Child' | 'Baby';

export type TravelerGroup = {
  id: string;
  count: number;
  type: TravelerType;
};

export type PricingRow = {
  id: string;
  count: number;
  type: string;
  unitPrice: number;
};

// How an optional extra's price is applied. 'free' shows "Free" and hides the
// amount; 'custom' shows `customUnitLabel` (e.g. "per night") next to the price.
export type ExtraPriceUnit = 'per_person' | 'per_group' | 'free' | 'custom';

export type ExtraOption = {
  id: string;
  name: string;
  price: number;
  // Legacy proposals saved before this field exists have it undefined; those
  // render without a unit suffix (see calculatePricing).
  priceUnit?: ExtraPriceUnit;
  customUnitLabel?: string;
  selected: boolean;
};

export type TransportModeType =
  | 'road_4x4'
  | 'road_shuttle'
  | 'road_bus'
  | 'mini_bus'
  | 'flight_domestic'
  | 'flight_bush';

export type ThemeType = 'minimalistic' | 'safari-portal' | 'kudu' | 'discovery';

export type BuilderContextType = {
  // Tour Details
  tourId: string | null;
  setTourId: React.Dispatch<React.SetStateAction<string | null>>;
  tourType: string;
  setTourType: React.Dispatch<React.SetStateAction<string>>;
  clientId: string | null;
  setClientId: React.Dispatch<React.SetStateAction<string | null>>;
  tourTitle: string;
  setTourTitle: React.Dispatch<React.SetStateAction<string>>;
  country: string | null;
  countries: string[];
  setCountries: React.Dispatch<React.SetStateAction<string[]>>;
  travelerGroups: TravelerGroup[];
  setTravelerGroups: React.Dispatch<React.SetStateAction<TravelerGroup[]>>;

  // Day by Day
  days: BuilderDay[];
  setDays: React.Dispatch<React.SetStateAction<BuilderDay[]>>;
  startDate: Date | undefined;
  setStartDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  startCity: string;
  setStartCity: React.Dispatch<React.SetStateAction<string>>;
  startCityCoordinates: [number, number] | null;
  setStartCityCoordinates: React.Dispatch<React.SetStateAction<[number, number] | null>>;
  endCity: string;
  setEndCity: React.Dispatch<React.SetStateAction<string>>;
  endCityCoordinates: [number, number] | null;
  setEndCityCoordinates: React.Dispatch<React.SetStateAction<[number, number] | null>>;
  transferIncluded: string;
  setTransferIncluded: React.Dispatch<React.SetStateAction<string>>;
  pickupPoint: string;
  setPickupPoint: React.Dispatch<React.SetStateAction<string>>;

  // Pricing
  pricingRows: PricingRow[];
  setPricingRows: React.Dispatch<React.SetStateAction<PricingRow[]>>;
  extras: ExtraOption[];
  setExtras: React.Dispatch<React.SetStateAction<ExtraOption[]>>;

  // Auto-pricing (rate-card driven)
  useAutoPricing: boolean;
  setUseAutoPricing: React.Dispatch<React.SetStateAction<boolean>>;
  vehicleId: string | null;
  setVehicleId: React.Dispatch<React.SetStateAction<string | null>>;
  markupPct: number;
  setMarkupPct: React.Dispatch<React.SetStateAction<number>>;
  pickupTransferId: string | null;
  setPickupTransferId: React.Dispatch<React.SetStateAction<string | null>>;
  dropoffTransferId: string | null;
  setDropoffTransferId: React.Dispatch<React.SetStateAction<string | null>>;

  // Inclusions & Exclusions
  inclusions: string[];
  setInclusions: React.Dispatch<React.SetStateAction<string[]>>;
  exclusions: string[];
  setExclusions: React.Dispatch<React.SetStateAction<string[]>>;

  // Theme
  selectedTheme: ThemeType;
  setSelectedTheme: React.Dispatch<React.SetStateAction<ThemeType>>;

  // Hero Image
  heroImage: string;
  setHeroImage: React.Dispatch<React.SetStateAction<string>>;
};

// ========== THEME TYPES (for rendering) ==========
export interface DayActivity {
  time: string;
  moment?: string; // One or more moments, comma-separated e.g. "Morning, Afternoon"
  activity: string;
  description: string;
  location?: string;
}

// A rendered alternative accommodation for the client-facing proposal. The
// price delta is preformatted for display (e.g. "−$200 per person / per night").
export interface ThemeAccommodationAlternative {
  name: string;
  rooms?: string; // e.g. "1x Double Room"
  meals?: string; // e.g. "Breakfast, Dinner"
  priceLabel?: string; // signed delta, already formatted; omitted when no price set
  images?: string[]; // lodge photos, shown in a lightbox when the client taps the alternative
}

export interface Day {
  day: number;
  date: string;
  title: string;
  description?: string; // Day description
  destination?: string; // Destination display name
  // National park id, when the day's destination is a catalog park. Keyed to the
  // curated photography in R2 under `national-parks/<id>/`. Absent for one-off
  // destinations added in the builder, which have no curated images.
  destinationId?: string;
  activities: DayActivity[];
  accommodation: string;
  accommodationAlternatives?: ThemeAccommodationAlternative[];
  meals: string;
  mealOptions?: string[];
  previewImage?: string; // Custom image for theme preview
  transportation?: ThemeTransportation; // Transfer happening on this day
}

export interface Location {
  name: string;
  coordinates: [number, number];
}

export interface Accommodation {
  id: string;
  name: string;
  image: string;
  images?: string[]; // Multiple images for carousel
  // overview?: string; // Short overview text
  description: string; // Full description
  location: string;
}

export interface ReviewLinkInfo {
  platform: 'google' | 'safaribookings' | 'tripadvisor';
  url: string;
  rating: number | null;
  reviewCount: number | null;
}

export interface SocialLinksInfo {
  instagram?: string;
  tiktok?: string;
  facebook?: string;
}

export interface OrganizationInfo {
  name: string;
  logoUrl: string | null;
  aboutDescription: string | null;
  paymentTerms: string | null;
  reviewLinks?: ReviewLinkInfo[] | null;
  socialLinks?: SocialLinksInfo | null;
  /** Postal address. Optional, and often an empty string rather than null. */
  address?: string | null;
  phone?: string | null;
}

export interface TripOverview {
  tourType?: string; // Safari, Beach, Adventure, etc.
  country?: string; // Main country
  travelerCount?: number; // Total number of travelers
  travelDates?: {
    start: string; // e.g., "January 15, 2025"
    end: string; // e.g., "January 20, 2025"
  };
  startCity?: string; // Pickup city
  endCity?: string; // Dropoff city
  destinations: string[]; // List of all destinations/parks to visit
}

export interface ThemeTransportation {
  id: string;
  originName: string;
  destinationName: string;
  mode: TransportModeType;
  modeLabel: string;
  durationFormatted: string | null;
  distanceKm: number | null;
  notes: string | null;
}

export interface ItineraryData {
  id: string;
  title: string;
  subtitle: string;
  clientName?: string;
  duration: string;
  location: string;
  heroImage: string;
  theme: ThemeType;
  organization?: OrganizationInfo;
  tripOverview?: TripOverview;
  itinerary: Day[];
  accommodations: Accommodation[];
  transportation?: ThemeTransportation[]; // Major transfers between destinations
  pricing: {
    total: string;
    perPerson: string;
    currency: string;
    breakdown?: {
      label: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }[];
    // Optional add-ons shown separately from (and NOT included in) the main
    // safari total. price is a preformatted display string (e.g. "$50" or
    // "Free"); unit is an optional suffix (e.g. "per person", "per night").
    extras?: {
      label: string;
      price: string;
      unit?: string;
    }[];
  };
  includedItems: string[];
  excludedItems: string[];
  mapData: {
    locations: Location[];
    startLocation?: Location;
    endLocation?: Location;
  };
}
