/**
 * Convert a Date to a timezone-safe ISO string that preserves the calendar day
 * the user actually picked.
 *
 * A date picker returns local midnight (e.g. Sept 9 00:00 in the browser's tz).
 * Calling `.toISOString()` on that would convert to UTC and, for any positive
 * UTC offset, roll the calendar day back one (Sept 9 00:00 +03:00 => Sept 8 21:00Z).
 *
 * Anchoring to noon UTC gives a 12-hour buffer in either direction, so the
 * calendar day survives any real-world timezone shift on both write and read.
 *
 * Always use this when serializing a picked calendar date for storage — never
 * send a raw Date or call `.toISOString()` directly on a picker value.
 */
export function toLocalISOString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}T12:00:00.000Z`;
}
