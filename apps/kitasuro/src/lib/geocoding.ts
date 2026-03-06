// Client-side geocoding using Photon (Komoot) — OSM-based autocomplete

// Approximate center coordinates for African safari countries (for location biasing)
const COUNTRY_CENTERS: Record<string, [number, number]> = {
  rwanda: [30.06, -1.94],
  tanzania: [34.89, -6.37],
  botswana: [24.68, -22.33],
  kenya: [37.91, -0.02],
  uganda: [32.29, 1.37],
  zambia: [28.28, -15.39],
  zimbabwe: [29.15, -19.02],
  namibia: [18.49, -22.96],
  mozambique: [35.53, -18.67],
  'south africa': [24.99, -28.48],
  ethiopia: [40.49, 9.15],
  malawi: [34.30, -13.25],
  'democratic republic of congo': [21.76, -4.04],
  burundi: [29.92, -3.37],
};

interface PhotonFeature {
  properties: {
    name?: string;
    country?: string;
    state?: string;
    county?: string;
    city?: string;
    district?: string;
    countrycode?: string;
  };
  geometry: {
    coordinates: [number, number]; // [lng, lat]
  };
}

export interface GeocodingResult {
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
}

function buildDisplayName(p: PhotonFeature['properties']): string {
  const parts = [p.name, p.district, p.city, p.county, p.state, p.country].filter(Boolean);
  const unique: string[] = [];
  for (const part of parts) {
    if (unique.length === 0 || unique[unique.length - 1] !== part) {
      unique.push(part!);
    }
  }
  return unique.join(', ');
}

const GEO_VALUE_RE = /^geo:(-?[\d.]+),(-?[\d.]+)::(.+)$/;

export function parseGeoValue(value: string) {
  const match = value.match(GEO_VALUE_RE);
  if (!match) return null;
  return { lat: parseFloat(match[1]!), lng: parseFloat(match[2]!), name: match[3]! };
}

export function buildGeoValue(lat: number, lng: number, name: string) {
  return `geo:${lat},${lng}::${name}`;
}

export async function searchPlaces(
  query: string,
  countries?: string[],
  signal?: AbortSignal,
): Promise<GeocodingResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: '8',
    lang: 'en',
  });

  // Photon's location bias ranks nearby results higher but does NOT
  // restrict results to the given country — unrelated regions may still appear.
  if (countries && countries.length > 0) {
    const center = COUNTRY_CENTERS[countries[0]!.toLowerCase()];
    if (center) {
      params.set('lon', String(center[0]));
      params.set('lat', String(center[1]));
    }
  }

  const response = await fetch(
    `https://photon.komoot.io/api/?${params.toString()}`,
    { signal },
  );

  if (!response.ok) return [];

  const data: { features: PhotonFeature[] } = await response.json();

  return data.features.map((f) => ({
    name: f.properties.name || query,
    displayName: buildDisplayName(f.properties),
    latitude: f.geometry.coordinates[1]!,
    longitude: f.geometry.coordinates[0]!,
  }));
}
