'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageIcon, X } from 'lucide-react';
import type { ThemeAccommodationAlternative } from '@/types/itinerary-types';

/**
 * "Also available" block shown under a day's primary accommodation on the
 * client-facing proposal. Lists each alternative lodge with its room/meal basis
 * and a signed price delta. Alternatives that have photos show a thumbnail and
 * open a lightbox gallery when tapped. Style-neutral so it reads well across all
 * themes.
 */
export function AccommodationAlternativesBlock({
  alternatives,
  className = '',
}: {
  alternatives?: ThemeAccommodationAlternative[];
  className?: string;
}) {
  // The alternative whose gallery is open, or null when the lightbox is closed.
  const [active, setActive] = useState<ThemeAccommodationAlternative | null>(null);

  if (!alternatives || alternatives.length === 0) return null;

  return (
    <div
      className={`mt-3 rounded-lg border border-dashed border-stone-300 bg-stone-50/60 p-3 ${className}`}
    >
      <div className="mb-2 text-[11px] font-bold tracking-wider text-stone-500 uppercase">
        Alternative Accommodation
      </div>
      <ul className="space-y-2">
        {alternatives.map((alt, i) => {
          const hasImages = !!alt.images && alt.images.length > 0;
          const thumb = hasImages ? alt.images![0] : null;
          return (
            <li key={i}>
              <div
                role={hasImages ? 'button' : undefined}
                tabIndex={hasImages ? 0 : undefined}
                onClick={hasImages ? () => setActive(alt) : undefined}
                onKeyDown={
                  hasImages
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActive(alt);
                        }
                      }
                    : undefined
                }
                className={`flex items-center gap-3 rounded-md ${
                  hasImages
                    ? 'cursor-pointer p-1 transition-colors hover:bg-stone-100/80 focus:bg-stone-100/80 focus:outline-none'
                    : ''
                }`}
              >
                {thumb && (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-stone-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumb}
                      alt={alt.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {alt.images!.length > 1 && (
                      <span className="absolute right-0.5 bottom-0.5 flex items-center gap-0.5 rounded bg-black/60 px-1 text-[9px] font-semibold text-white">
                        <ImageIcon className="h-2.5 w-2.5" />
                        {alt.images!.length}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <div className="min-w-0">
                    <span
                      className={`font-medium text-stone-800 ${
                        hasImages ? 'underline decoration-stone-300 underline-offset-2' : ''
                      }`}
                    >
                      {alt.name}
                    </span>
                    {(alt.rooms || alt.meals) && (
                      <span className="ml-2 text-xs text-stone-500">
                        {[alt.rooms, alt.meals].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </div>
                  {alt.priceLabel && (
                    <span
                      className={`shrink-0 text-sm font-semibold ${
                        alt.priceLabel.startsWith('−') ? 'text-green-700' : 'text-stone-700'
                      }`}
                    >
                      {alt.priceLabel}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {active && active.images && active.images.length > 0 && (
        <AlternativeLightbox
          name={active.name}
          images={active.images}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}

/** Full-screen photo gallery for one alternative lodge. */
function AlternativeLightbox({
  name,
  images,
  onClose,
}: {
  name: string;
  images: string[];
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const count = images.length;

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + count) % count),
    [count],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="relative flex max-h-[80vh] w-full max-w-4xl items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {count > 1 && (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous photo"
            className="absolute left-2 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index]}
          alt={`${name} — photo ${index + 1}`}
          className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain"
        />
        {count > 1 && (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next photo"
            className="absolute right-2 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      <div className="mt-4 text-center text-white" onClick={(e) => e.stopPropagation()}>
        <div className="font-serif text-lg">{name}</div>
        {count > 1 && (
          <div className="mt-1 text-sm text-white/70">
            {index + 1} / {count}
          </div>
        )}
      </div>
    </div>
  );
}
