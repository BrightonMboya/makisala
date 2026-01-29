import type React from 'react';

// ========== BUILDER TYPES (for form/state management) ==========
export type BuilderActivity = {
  id: string;
  name: string;
  location: string;
  moment: 'Morning' | 'Afternoon' | 'Evening' | 'Half Day' | 'Full Day' | 'Night';
  isOptional: boolean;
  description?: string;
  imageUrl?: string;
};

export type BuilderDay = {
  id: string;
  dayNumber: number;
  date: string;
  accommodation: string | null;
  accommodationName?: string | null; // Cached name to avoid re-fetching
  destination: string | null;
  activities: BuilderActivity[];
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  description?: string; // Narrative for the day
  accommodationImage?: string;
  previewImage?: string; // Custom image for theme preview
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

export type ExtraOption = {
  id: string;
  name: string;
  price: number;
  selected: boolean;
};

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
  travelerGroups: TravelerGroup[];
  setTravelerGroups: React.Dispatch<React.SetStateAction<TravelerGroup[]>>;

  // Day by Day
  days: BuilderDay[];
  setDays: React.Dispatch<React.SetStateAction<BuilderDay[]>>;
  startDate: Date | undefined;
  setStartDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  startCity: string;
  setStartCity: React.Dispatch<React.SetStateAction<string>>;
  endCity: string;
  setEndCity: React.Dispatch<React.SetStateAction<string>>;
  transferIncluded: string;
  setTransferIncluded: React.Dispatch<React.SetStateAction<string>>;
  pickupPoint: string;
  setPickupPoint: React.Dispatch<React.SetStateAction<string>>;

  // Pricing
  pricingRows: PricingRow[];
  setPricingRows: React.Dispatch<React.SetStateAction<PricingRow[]>>;
  extras: ExtraOption[];
  setExtras: React.Dispatch<React.SetStateAction<ExtraOption[]>>;

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
  activity: string;
  description: string;
  location?: string;
}

export interface Day {
  day: number;
  date: string;
  title: string;
  description?: string; // Day description
  destination?: string; // Store the original destination value for matching
  nationalParkId?: string; // Store the national park ID for direct matching
  activities: DayActivity[];
  accommodation: string;
  meals: string;
  previewImage?: string; // Custom image for theme preview
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

export interface NationalParkInfo {
  id: string;
  name: string;
  park_overview: Array<{ title: string; description: string }> | null;
  featured_image_url: string | null;
}

export interface OrganizationInfo {
  name: string;
  logoUrl: string | null;
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
  itinerary: Day[];
  accommodations: Accommodation[];
  nationalParks?: Record<string, NationalParkInfo>; // Key is destination value (e.g., 'akagera-np')
  pricing: {
    total: string;
    perPerson: string;
    currency: string;
  };
  includedItems: string[];
  excludedItems: string[];
  importantNotes: {
    description: string;
    points: string[];
  };
  mapData: {
    locations: Location[];
    startLocation?: Location;
    endLocation?: Location;
  };
}
