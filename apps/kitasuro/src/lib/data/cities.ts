// Cities organized by country for start/end location selection
// Coordinates are [longitude, latitude] for GeoJSON/MapLibre compatibility

export type City = {
  value: string;
  label: string;
  country: string;
  coordinates: [number, number];
};

export const CITIES: City[] = [
  // Rwanda
  { value: 'kigali', label: 'Kigali', country: 'rwanda', coordinates: [30.0619, -1.9441] },
  { value: 'kigali-airport', label: 'Kigali International Airport', country: 'rwanda', coordinates: [30.1395, -1.9686] },

  // Tanzania
  { value: 'arusha', label: 'Arusha', country: 'tanzania', coordinates: [36.683, -3.367] },
  { value: 'kilimanjaro-airport', label: 'Kilimanjaro International Airport', country: 'tanzania', coordinates: [37.0745, -3.4294] },
  { value: 'dar-es-salaam', label: 'Dar es Salaam', country: 'tanzania', coordinates: [39.2083, -6.7924] },
  { value: 'jnia', label: 'Julius Nyerere International Airport', country: 'tanzania', coordinates: [39.2026, -6.8781] },
  { value: 'mwanza', label: 'Mwanza', country: 'tanzania', coordinates: [32.9, -2.5167] },

  // Botswana
  { value: 'maun', label: 'Maun', country: 'botswana', coordinates: [23.4167, -19.9833] },
  { value: 'maun-airport', label: 'Maun Airport', country: 'botswana', coordinates: [23.4311, -19.9726] },
  { value: 'kasane', label: 'Kasane', country: 'botswana', coordinates: [25.1625, -17.8283] },
  { value: 'gaborone', label: 'Gaborone', country: 'botswana', coordinates: [25.9201, -24.6282] },

  // Kenya
  { value: 'nairobi', label: 'Nairobi', country: 'kenya', coordinates: [36.8219, -1.2921] },
  { value: 'jkia', label: 'Jomo Kenyatta International Airport', country: 'kenya', coordinates: [36.9275, -1.3192] },
  { value: 'wilson-airport', label: 'Wilson Airport', country: 'kenya', coordinates: [36.8186, -1.3214] },
  { value: 'mombasa', label: 'Mombasa', country: 'kenya', coordinates: [39.6682, -4.0435] },

  // Uganda
  { value: 'entebbe', label: 'Entebbe', country: 'uganda', coordinates: [32.4633, 0.0467] },
  { value: 'entebbe-airport', label: 'Entebbe International Airport', country: 'uganda', coordinates: [32.4433, 0.0467] },
  { value: 'kampala', label: 'Kampala', country: 'uganda', coordinates: [32.5825, 0.3476] },
];

// Map park names to countries
export const PARK_COUNTRY_MAP: Record<string, string> = {
  // Rwanda
  volcanoes: 'rwanda',
  'volcanoes national park': 'rwanda',
  nyungwe: 'rwanda',
  'nyungwe forest': 'rwanda',
  akagera: 'rwanda',
  'gishwati-mukura': 'rwanda',
  gishwati: 'rwanda',

  // Tanzania
  serengeti: 'tanzania',
  ngorongoro: 'tanzania',
  tarangire: 'tanzania',
  'lake manyara': 'tanzania',
  'lake-manyara': 'tanzania',
  kilimanjaro: 'tanzania',
  gombe: 'tanzania',
  nyerere: 'tanzania',
  selous: 'tanzania',
  arusha: 'tanzania',

  // Botswana
  chobe: 'botswana',
  okavango: 'botswana',
  moremi: 'botswana',

  // Kenya
  'maasai mara': 'kenya',
  'masai mara': 'kenya',
  amboseli: 'kenya',
  tsavo: 'kenya',
  samburu: 'kenya',

  // Uganda
  bwindi: 'uganda',
  'bwindi impenetrable': 'uganda',
  'queen elizabeth': 'uganda',
  'murchison falls': 'uganda',
  kibale: 'uganda',
};

/**
 * Determine the country from a park name
 */
export function getCountryFromParkName(parkName: string | null): string | null {
  if (!parkName) return null;
  const parkLower = parkName.toLowerCase().trim();

  // Try exact match first
  if (PARK_COUNTRY_MAP[parkLower]) {
    return PARK_COUNTRY_MAP[parkLower];
  }

  // Try partial match
  for (const [key, country] of Object.entries(PARK_COUNTRY_MAP)) {
    if (parkLower.includes(key) || key.includes(parkLower)) {
      return country;
    }
  }

  return null;
}

/**
 * Get cities filtered by country
 */
export function getCitiesByCountry(country: string | null): City[] {
  if (!country) return CITIES;
  return CITIES.filter((city) => city.country === country.toLowerCase());
}

/**
 * Get city coordinates by value or label
 */
export function getCityByValue(value: string | null): City | undefined {
  if (!value) return undefined;
  const valueLower = value.toLowerCase().trim();
  return CITIES.find(
    (city) => city.value === valueLower || city.label.toLowerCase() === valueLower
  );
}
