import type { PdfPalette } from './theme';
import type { ImageBook } from './images';
import type { DayPhotoPlans } from './helpers';

/**
 * Per-render document scope that every page component reads.
 *
 * This is React context's job, but context can't be used here: `createContext` is
 * banned in Next's server graph, and marking the module `'use client'` only turns
 * the components into client references a route handler can't invoke.
 *
 * A module-level store is safe because of where it's set. `pdf(element)` invokes
 * every component synchronously, only layout is async, and Node won't interleave
 * another request inside a synchronous block — so two concurrent renders can't
 * observe each other's scope.
 *
 * The rule this buys: read the scope during render, never inside a deferred
 * callback. A `fixed` element's `render` prop fires during layout, after the scope
 * is gone, so close over the value instead of calling usePdfDoc() inside it.
 */

export interface PdfDocScope {
  palette: PdfPalette;
  images: ImageBook;
  /** Which photos each day's pages show, decided once by planAllDayPhotos. */
  photoPlans: DayPhotoPlans;
  /** Right-hand footer text, e.g. the operator's name. */
  brandName: string;
}

let current: PdfDocScope | null = null;

/** `build` must be the `pdf(element)` call itself, not an async wrapper. */
export function withDocScope<T>(scope: PdfDocScope, build: () => T): T {
  const previous = current;
  current = scope;
  try {
    return build();
  } finally {
    current = previous;
  }
}

export function usePdfDoc(): PdfDocScope {
  if (!current) {
    throw new Error(
      'Proposal PDF components must render inside withDocScope(); use renderProposalPdf().',
    );
  }
  return current;
}

export const usePalette = (): PdfPalette => usePdfDoc().palette;
