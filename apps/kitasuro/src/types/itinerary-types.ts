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
}

export interface Location {
  name: string;
  coordinates: [number, number];
}

export interface Accommodation {
  id: string;
  name: string;
  image: string;
  description: string;
  location: string;
}

export interface NationalParkInfo {
  id: string;
  name: string;
  park_overview: Array<{ title: string; description: string }> | null;
  featured_image_url: string | null;
}

export interface ItineraryData {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  location: string;
  heroImage: string;
  theme: 'minimalistic' | 'safari-portal';
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
    geojson: any;
    locations: Location[];
    scale: number;
    rotate: [number, number, number];
  };
}
