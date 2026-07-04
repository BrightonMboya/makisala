import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Join words into a natural-language list: the last word gets an "and".
//   ["Hello", "world"]    -> "Hello and world"
//   ["a", "b", "c"]       -> "a, b, and c"
export function joinWithAnd(words: string[]): string {
  const cleaned = words.map((w) => w.trim()).filter(Boolean);
  return new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(cleaned);
}

// Build the "time · moment" label shown against an activity in the themes.
// A moment is stored comma-separated (e.g. "Morning, Evening") and rendered
// as a natural list ("Morning and Evening").
export function formatActivityTiming(time?: string, moment?: string): string {
  const momentLabel = moment ? joinWithAnd(moment.split(',')) : '';
  return [time, momentLabel].filter(Boolean).join(' · ');
}

export function formatPrice(price: string | number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(Number(price));
}

// UI Constants
export const MAX_VISIBLE_TAGS = 3;
