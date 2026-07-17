import type {
  Accommodation,
  Day,
  DayActivity,
  ItineraryData,
  ThemeAccommodationAlternative,
} from '@/types/itinerary-types';

/** Data shaping shared by the proposal PDF's page archetypes. */

/**
 * Resolve a day's accommodation record. `Day.accommodation` carries only a display
 * name (see proposal-transform), so the detail — description, photos, location —
 * has to be matched out of `accommodations[]` by name.
 */
export function accommodationFor(data: ItineraryData, day: Day): Accommodation | undefined {
  if (!day.accommodation) return undefined;
  const target = day.accommodation.trim().toLowerCase();
  return data.accommodations.find((a) => a.name.trim().toLowerCase() === target);
}

/** Placeholder names the transform emits when a day has no real lodge. */
const NO_ACCOMMODATION = ['to be confirmed', 'last day, no accommodation', 'no accommodation'];

export function hasRealAccommodation(day: Day): boolean {
  const name = day.accommodation?.trim().toLowerCase();
  return !!name && !NO_ACCOMMODATION.includes(name);
}

export interface ActivityGroup {
  moment: string;
  activities: DayActivity[];
}

/**
 * Group a day's activities under their moment heading ("Morning", "After lunch"),
 * preserving the operator's authored order rather than sorting into a canonical
 * day cycle — operators sequence deliberately, and reordering misreads the day.
 * Consecutive runs of the same moment collapse into one heading.
 */
export function groupByMoment(activities: DayActivity[]): ActivityGroup[] {
  const groups: ActivityGroup[] = [];
  for (const activity of activities) {
    const moment = activity.moment?.trim() || activity.time || '';
    const last = groups[groups.length - 1];
    if (last && last.moment === moment) last.activities.push(activity);
    else groups.push({ moment, activities: [activity] });
  }
  return groups;
}

/**
 * A day's lodge photography, lead image first.
 *
 * Kept separate from dayPhotos because only these may be captioned with the lodge's
 * name. The day's preview image is a destination shot, so labelling it "<Lodge>"
 * tells the client a waterhole is a bedroom.
 */
export function accommodationPhotos(data: ItineraryData, day: Day): string[] {
  const accommodation = accommodationFor(data, day);
  const urls = [accommodation?.image, ...(accommodation?.images ?? [])].filter(
    (u): u is string => !!u,
  );
  return [...new Set(urls)];
}

/**
 * Every photo for a day, most relevant first: the day's own preview image, then
 * its lodge's gallery. Deduplicated — the lodge's lead image is very often also
 * the day preview.
 */
export function dayPhotos(data: ItineraryData, day: Day): string[] {
  const urls = [day.previewImage, ...accommodationPhotos(data, day)].filter(
    (u): u is string => !!u,
  );
  return [...new Set(urls)];
}

/**
 * Lead thumb plus two rows of three. A client is being asked to pay extra for this
 * lodge sight-unseen, so it gets roughly the coverage the booked one does; galleries
 * also tend to open on near-identical room shots, and a short set shows only those.
 */
const ALT_PHOTO_COUNT = 7;

/**
 * An alternative lodge's photos. Read by both AlternativesPage and planImages, so
 * the two can't disagree about how many the page will ask for.
 */
export function alternativePhotos(alternative: ThemeAccommodationAlternative): string[] {
  return [...new Set(alternative.images ?? [])].slice(0, ALT_PHOTO_COUNT);
}

/** Split a meal string ("Breakfast, Lunch") and its extras into display lines. */
export function mealLines(day: Day): string[] {
  const base = day.meals && day.meals !== 'None' ? [day.meals.replace(/, ([^,]*)$/, ' & $1')] : [];
  return [...base, ...(day.mealOptions ?? [])];
}

// ---------- photo planning ----------

/** FNV-1a. */
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32. */
function prng(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Seeded Fisher-Yates. Must not use Math.random: a proposal has to deal the same
 * photographs on every render, or re-sending one after a typo fix changes every
 * image in the document.
 */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  const next = prng(hashSeed(seed));
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Lead plus three fills the intro collage. */
const INTRO_COUNT = 4;
const DETAIL_COUNT = 2;
/** One page's worth. Lodge galleries run to 20+ near-identical shots. */
export const GALLERY_MAX = 6;

export interface DayPhotoPlan {
  intro: string[];
  detail: string[];
  gallery: string[];
}

/**
 * Decide a day's photography once. planImages must request exactly what the pages
 * render, so both read this rather than slicing the arrays themselves; anything
 * it misses renders as a blank placeholder.
 */
export function planDayPhotos(
  data: ItineraryData,
  day: Day,
  destinationPhotos: string[],
  seed: string,
): DayPhotoPlan {
  const lodge = accommodationPhotos(data, day);
  const destination = seededShuffle(destinationPhotos, seed);

  // The intro announces a place, so it leads with the place; the day's own photos
  // are the fallback for destinations with no curated set.
  const intro = (destination.length > 0 ? destination : dayPhotos(data, day)).slice(0, INTRO_COUNT);

  // Each photo appears once per day. Whatever the intro already spent is off the
  // table, so a day whose collage fell back to lodge photos doesn't reprint them.
  const shown = new Set(intro);
  const remaining = lodge.filter((url) => !shown.has(url));

  return {
    intro,
    detail: remaining.slice(0, DETAIL_COUNT),
    gallery: remaining.slice(DETAIL_COUNT, DETAIL_COUNT + GALLERY_MAX),
  };
}

/** Keyed by day number. */
export type DayPhotoPlans = Map<number, DayPhotoPlan>;

export function planAllDayPhotos(
  data: ItineraryData,
  destinationPhotos: Map<string, string[]>,
  seed: string,
): DayPhotoPlans {
  const plans: DayPhotoPlans = new Map();
  for (const day of data.itinerary) {
    const photos = day.destinationId ? (destinationPhotos.get(day.destinationId) ?? []) : [];
    // Seeded per destination too, so a trip visiting one park twice doesn't lead
    // both days with the same photograph.
    plans.set(day.day, planDayPhotos(data, day, photos, `${seed}:${day.destinationId ?? day.day}`));
  }
  return plans;
}

export function travelerLabel(data: ItineraryData): string {
  const count = data.tripOverview?.travelerCount;
  if (!count) return '';
  return `${count} ${count === 1 ? 'Adult' : 'Adults'}`;
}
