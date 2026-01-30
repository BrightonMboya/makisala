'use client';

import { AccommodationCard } from './AccommodationCard';

interface Accommodation {
  id: string;
  name: string;
  url: string | null;
  imageUrl: string | null;
}

interface AccommodationSelectorProps {
  accommodations: Accommodation[];
}

export function AccommodationSelector({ accommodations }: AccommodationSelectorProps) {
  if (accommodations.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border bg-white text-gray-500 shadow-sm">
        No accommodations found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {accommodations.map((acc) => (
        <AccommodationCard key={acc.id} accommodation={acc} />
      ))}
    </div>
  );
}
