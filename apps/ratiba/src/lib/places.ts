import { env } from '@/lib/env';
import { log, serializeError } from '@/lib/logger';

// Google Places API (New), API-key auth. We only ever read a business's aggregate
// rating and total review count (the numbers behind the proposal review badge) plus
// the identifiers needed to link back and refresh later — never individual review
// text, which the API caps at 5 and forbids caching. The field mask is deliberately
// minimal to stay in the cheapest applicable SKU.
const PLACES_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const PLACES_DETAILS_URL = 'https://places.googleapis.com/v1/places';

// Google's Text Search returns many results; the caller only needs a short pick list.
const MAX_CANDIDATES = 5;

export interface PlaceCandidate {
  placeId: string;
  name: string;
  address: string | null;
  rating: number | null;
  reviewCount: number | null;
  mapsUri: string | null;
}

/** Thrown when the Places key is unset so callers can surface a clear message. */
export class PlacesNotConfiguredError extends Error {
  constructor() {
    super('Google Places is not configured on this deployment.');
    this.name = 'PlacesNotConfiguredError';
  }
}

interface RawPlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
}

function toCandidate(p: RawPlace): PlaceCandidate | null {
  if (!p.id) return null;
  return {
    placeId: p.id,
    name: p.displayName?.text ?? '',
    address: p.formattedAddress ?? null,
    rating: typeof p.rating === 'number' ? p.rating : null,
    reviewCount: typeof p.userRatingCount === 'number' ? p.userRatingCount : null,
    mapsUri: p.googleMapsUri ?? null,
  };
}

/** Search Google for a business by name. Returns up to MAX_CANDIDATES matches. */
export async function searchPlaces(query: string): Promise<PlaceCandidate[]> {
  const apiKey = env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new PlacesNotConfiguredError();

  const trimmed = query.trim();
  if (!trimmed) return [];

  const response = await fetch(PLACES_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri',
    },
    body: JSON.stringify({ textQuery: trimmed, maxResultCount: MAX_CANDIDATES }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    log.error('places.searchText failed', { status: response.status, detail });
    throw new Error('Google Places search failed. Please try again.');
  }

  const data = (await response.json()) as { places?: RawPlace[] };
  return (data.places ?? []).map(toCandidate).filter((c): c is PlaceCandidate => c !== null);
}

/**
 * Fetch the current rating + review count for a known place_id. Used both when a
 * business is first connected and by the periodic refresh job. Returns null if the
 * place can no longer be found (e.g. the listing was removed) so callers can decide
 * whether to keep the stale value or drop the connection.
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceCandidate | null> {
  const apiKey = env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new PlacesNotConfiguredError();

  try {
    const response = await fetch(`${PLACES_DETAILS_URL}/${encodeURIComponent(placeId)}`, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,googleMapsUri',
      },
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      log.error('places.details failed', { status: response.status, detail, placeId });
      throw new Error('Google Places lookup failed. Please try again.');
    }

    return toCandidate((await response.json()) as RawPlace);
  } catch (error) {
    if (error instanceof PlacesNotConfiguredError) throw error;
    log.error('places.details error', { ...serializeError(error), placeId });
    throw error;
  }
}
