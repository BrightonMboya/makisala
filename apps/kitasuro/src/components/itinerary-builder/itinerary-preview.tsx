'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { format, addDays } from 'date-fns';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  DollarSign,
  Utensils,
  BedDouble,
  Camera,
  Map,
  X,
  Check,
} from 'lucide-react';
import { ItineraryMap } from './itinerary-map';
import type {
  BuilderDay as Day,
  TravelerGroup,
  PricingRow,
  ExtraOption,
} from '@/types/itinerary-types';
import { getAllNationalParks, getAllAccommodations } from '@/app/itineraries/actions';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/query-keys';

export function ItineraryPreview({
  days,
  startDate,
  travelerGroups,
  tourType,
  pricingRows,
  extras,
  clientName,
  tourTitle = 'Your Safari Adventure',
  isPublic = false,
  className,
  inclusions,
  exclusions,
}: {
  days: Day[];
  startDate: Date | undefined;
  travelerGroups: TravelerGroup[];
  tourType: string;
  pricingRows: PricingRow[];
  extras: ExtraOption[];
  clientName: string;
  tourTitle?: string;
  isPublic?: boolean;
  className?: string;
  inclusions?: string[];
  exclusions?: string[];
}) {
  // Calculations
  const totalDuration = days.length;
  const endDate = startDate ? addDays(startDate, totalDuration - 1) : undefined;

  const totalPrice =
    pricingRows.reduce((acc, row) => acc + row.unitPrice * row.count, 0) +
    extras.filter((e) => e.selected).reduce((acc, e) => acc + e.price, 0);

  // Use React Query for caching - shares cache with day-by-day page
  const { data: parksData } = useQuery({
    queryKey: queryKeys.nationalParks,
    queryFn: getAllNationalParks,
    staleTime: staleTimes.nationalParks,
  });

  const { data: accommodationsData } = useQuery({
    queryKey: queryKeys.accommodations.all,
    queryFn: getAllAccommodations,
    staleTime: staleTimes.accommodations,
  });

  const nationalParksMap = useMemo(() => {
    const parksMap: Record<string, { name: string; image?: string; latitude?: string | null; longitude?: string | null }> = {};
    (parksData || []).forEach((p) => {
      parksMap[p.id] = { name: p.name, latitude: p.latitude, longitude: p.longitude };
    });
    return parksMap;
  }, [parksData]);

  const accommodationsMap = useMemo(() => {
    const accsMap: Record<string, { name: string; image?: string; description?: string }> = {};
    (accommodationsData || []).forEach((a: any) => {
      accsMap[a.id] = {
        name: a.name,
        description: a.overview || undefined,
        image: a.images?.[0]?.imageUrl || undefined,
      };
    });
    return accsMap;
  }, [accommodationsData]);

  const heroImage =
    'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=2000&auto=format&fit=crop';

  return (
    <div
      className={cn(
        'mx-auto max-w-5xl space-y-16 bg-white pb-24 font-sans text-stone-800',
        className,
      )}
    >
      {/* Header / Hero Section */}
      <div className="relative h-[60vh] w-full overflow-hidden rounded-b-3xl">
        {/* Fallback hero image or dynamic one based on first destination */}
        <Image src={heroImage} alt="Safari Hero" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute right-0 bottom-0 left-0 space-y-6 p-8 text-white md:p-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-medium tracking-wider uppercase backdrop-blur-sm">
            <span>{tourType}</span>
          </div>
          <h1 className="font-serif text-4xl leading-tight font-bold md:text-6xl">
            {tourTitle || 'Your Safari Adventure'}
          </h1>
          {clientName && (
            <p className="text-lg font-light text-white/90 md:text-xl">
              Prepared exclusively for <span className="font-semibold italic">{clientName}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-6 pt-4 text-sm font-medium tracking-wide text-white/80 uppercase">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>
                {totalDuration} Days / {totalDuration - 1} Nights
              </span>
            </div>
            {startDate && endDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>
                  {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>{travelerGroups.reduce((acc, g) => acc + g.count, 0)} Travelers</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-16 px-6 md:px-12 lg:grid-cols-[1fr_350px]">
        {/* Left Column: Itinerary Details */}
        <div className="space-y-16">
          {/* Introduction / Summary */}
          <div className="prose prose-stone max-w-none">
            <p className="text-xl leading-relaxed font-light text-stone-600">
              Welcome to your personalized itinerary. This journey has been carefully curated to
              offer you the best of Rwanda's landscapes, wildlife, and culture. From the vibrant
              streets of Kigali to the misty volcanoes and savannah plains, get ready for an
              unforgettable adventure.
            </p>

            {/* Interactive Map Section */}
            <div className="mb-12 overflow-hidden rounded-2xl border border-stone-100 shadow-sm">
              <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50 px-6 py-4">
                <Map className="h-5 w-5 text-green-600" />
                <h3 className="font-serif text-lg font-bold text-stone-900">Your Route</h3>
              </div>
              <ItineraryMap days={days} nationalParksMap={nationalParksMap} className="rounded-none border-0 shadow-none" />
            </div>
          </div>

          {/* Day by Day Plan */}
          <div className="space-y-12">
            <div className="flex items-center gap-4">
              <h2 className="font-serif text-2xl font-bold text-stone-900">Daily Itinerary</h2>
              <div className="h-px flex-1 bg-stone-200" />
            </div>

            <div className="space-y-12">
              {days.map((day, index) => {
                const currentDate = startDate ? addDays(startDate, index) : null;
                const destinationData = day.destination ? nationalParksMap[day.destination] : null;
                const accommodationData = day.accommodation
                  ? accommodationsMap[day.accommodation]
                  : null;

                return (
                  <div
                    key={day.id}
                    className="relative border-l border-stone-200 pb-12 pl-8 last:border-0 last:pb-0 md:pl-12"
                  >
                    {/* Day Marker */}
                    <div className="absolute top-0 -left-[17px] flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 text-sm font-bold text-white shadow-lg ring-4 ring-white">
                      {day.dayNumber}
                    </div>

                    <div className="space-y-8">
                      {/* Date & Destination Header */}
                      <div>
                        <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-baseline md:gap-4">
                          <span className="text-sm font-bold tracking-widest text-green-700 uppercase">
                            {currentDate
                              ? format(currentDate, 'EEEE, MMMM do')
                              : `Day ${day.dayNumber}`}
                          </span>
                          {day.destination && (
                            <span className="flex items-center gap-1 text-sm font-medium text-stone-400">
                              <MapPin className="h-3 w-3" />
                              {nationalParksMap[day.destination]?.name || day.destination}
                            </span>
                          )}
                        </div>
                        <h3 className="mb-4 text-2xl font-bold text-stone-900">
                          {destinationData
                            ? `Explore ${destinationData.name}`
                            : day.activities[0]?.name || 'Leisure Day'}
                        </h3>

                        {/* Day Narrative / Description */}
                        {day.description && (
                          <div className="prose prose-stone prose-sm mb-6 max-w-none">
                            <p className="leading-relaxed whitespace-pre-wrap text-stone-600">
                              {day.description}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Destination Highlight if New or Main (Keep existing logic, but maybe move it after narrative) */}
                      {destinationData?.image && !day.description && (
                        <div className="group relative mb-6 h-64 w-full overflow-hidden rounded-2xl">
                          <Image
                            src={destinationData.image}
                            alt={destinationData.name || 'Destination'}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </div>
                      )}

                      {/* Activities List */}
                      {day.activities.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="flex items-center gap-2 text-sm font-bold tracking-wider text-stone-500 uppercase">
                            <Camera className="h-4 w-4" /> Today's Highlights
                          </h4>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {day.activities.map((activity) => {
                              const description = activity.description || '';
                              const imageUrl = activity.imageUrl;

                              return (
                                <div
                                  key={activity.id}
                                  className="overflow-hidden rounded-xl border border-stone-100 bg-stone-50 transition-shadow duration-300 hover:shadow-md"
                                >
                                  {imageUrl && (
                                    <div className="relative h-40 w-full">
                                      <Image
                                        src={imageUrl}
                                        alt={activity.name}
                                        fill
                                        className="object-cover"
                                      />
                                      <div className="absolute top-2 right-2">
                                        <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold tracking-wide text-stone-800 uppercase shadow-sm backdrop-blur-sm">
                                          {activity.moment}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  <div className="space-y-3 p-4">
                                    {!imageUrl && (
                                      <div className="flex items-start justify-between">
                                        <span className="rounded-full bg-stone-200 px-2 py-1 text-[10px] font-medium tracking-wide text-stone-600 uppercase">
                                          {activity.moment}
                                        </span>
                                      </div>
                                    )}
                                    <div>
                                      <h5 className="mb-1 text-lg leading-tight font-bold text-stone-800">
                                        {activity.name}
                                      </h5>
                                      {activity.isOptional && (
                                        <span className="rounded border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-600 uppercase">
                                          Optional
                                        </span>
                                      )}
                                    </div>

                                    {description && (
                                      <p className="line-clamp-4 text-xs leading-relaxed text-stone-600">
                                        {description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Accommodation & Meals */}
                      <div className="flex flex-col gap-4 md:flex-row">
                        {/* Accommodation Card */}
                        <div className="flex flex-1 items-start gap-4 rounded-xl border border-stone-100 bg-white p-4 shadow-sm">
                          {(accommodationData || day.accommodationImage) && (
                            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                              <Image
                                src={day.accommodationImage || accommodationData?.image || ''}
                                alt={accommodationData?.name || 'Accommodation'}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <h4 className="mb-1 flex items-center gap-2 text-xs font-bold tracking-wider text-stone-400 uppercase">
                              <BedDouble className="h-3 w-3" /> Accommodation
                            </h4>
                            <p className="text-lg font-bold text-stone-800">
                              {accommodationData
                                ? accommodationData.name
                                : day.accommodation || 'To be confirmed'}
                            </p>
                            {accommodationData?.description && (
                              <p className="mt-2 line-clamp-2 text-sm text-stone-600">
                                {accommodationData.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Meals Card */}
                        <div className="flex flex-col justify-center rounded-xl bg-stone-50 p-4 md:w-1/3">
                          <h4 className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-stone-400 uppercase">
                            <Utensils className="h-3 w-3" /> Meal Plan
                          </h4>
                          <div className="flex gap-2">
                            <MealIndicator
                              label="B"
                              active={day.meals.breakfast}
                              full="Breakfast"
                            />
                            <MealIndicator label="L" active={day.meals.lunch} full="Lunch" />
                            <MealIndicator label="D" active={day.meals.dinner} full="Dinner" />
                          </div>
                          <p className="mt-2 text-xs text-stone-500 italic">
                            Drinks not included unless specified
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Summary & Pricing */}
        <div className="relative">
          <div className="sticky top-8 space-y-8">
            {/* Inclusions & Exclusions */}
            {(inclusions?.length || exclusions?.length) && (
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                {inclusions && inclusions.length > 0 && (
                  <div className="space-y-4 p-6">
                    <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-stone-800 uppercase">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                      Included
                    </h3>
                    <ul className="space-y-2.5">
                      {inclusions.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-stone-600">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-green-500" />
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {inclusions && exclusions && <div className="mx-6 h-px bg-stone-100" />}

                {exclusions && exclusions.length > 0 && (
                  <div className="space-y-4 bg-stone-50/50 p-6">
                    <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-stone-800 uppercase">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100">
                        <X className="h-3 w-3 text-red-600" />
                      </div>
                      Excluded
                    </h3>
                    <ul className="space-y-2.5">
                      {exclusions.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-stone-600">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-red-400" />
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Pricing Summary */}
            {!isPublic && (
              <div className="space-y-6 rounded-3xl bg-stone-900 p-8 text-white shadow-xl">
                <h3 className="flex items-center gap-2 font-serif text-lg font-bold">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  Investment Summary
                </h3>

                <div className="space-y-4 text-sm text-stone-300">
                  {pricingRows.map((row) => (
                    <div key={row.id} className="flex items-center justify-between">
                      <span>
                        {row.count}x {row.type}
                      </span>
                      <span className="font-mono text-white">
                        ${(row.unitPrice * row.count).toLocaleString()}
                      </span>
                    </div>
                  ))}

                  {extras.filter((e) => e.selected).length > 0 && (
                    <>
                      <div className="my-2 h-px bg-white/10" />
                      <div className="mb-2 text-xs font-bold tracking-wider text-stone-500 uppercase">
                        Extras
                      </div>
                      {extras
                        .filter((e) => e.selected)
                        .map((extra) => (
                          <div key={extra.id} className="flex items-center justify-between text-xs">
                            <span>{extra.name}</span>
                            <span className="font-mono text-white">
                              ${extra.price.toLocaleString()}
                            </span>
                          </div>
                        ))}
                    </>
                  )}

                  <div className="my-4 h-px bg-white/20" />

                  <div className="flex items-baseline justify-between pt-2">
                    <span className="text-base font-medium">Total Estimated Cost</span>
                    <span className="font-serif text-3xl font-bold text-green-400">
                      ${totalPrice.toLocaleString()}
                    </span>
                  </div>
                  <p className="pt-4 text-center text-[10px] text-stone-500">
                    * Prices are subject to availability and change until confirmed.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
              <h3 className="font-bold text-stone-800">Why Travel With Us?</h3>
              <ul className="space-y-3 text-sm text-stone-600">
                <li className="flex gap-3">
                  <div className="mt-2 h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span>24/7 On-ground support throughout your journey</span>
                </li>
                <li className="flex gap-3">
                  <div className="mt-2 h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span>Expert driver-guides with deep local knowledge</span>
                </li>
                <li className="flex gap-3">
                  <div className="mt-2 h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span>Sustainable tourism effectively contributing to conservation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MealIndicator({
  label,
  style,
  full,
  active,
}: {
  label: string;
  style?: string;
  full: string;
  active: boolean;
}) {
  if (!active) return null;
  return (
    <span
      title={full}
      className="inline-flex h-6 w-6 cursor-help items-center justify-center rounded-full border border-green-200 bg-green-100 text-xs font-bold text-green-800"
    >
      {label}
    </span>
  );
}

// Helper to map values to labels for destinations if needed,
// though we use the rich content map primarily.
const nationalParksMap: Record<string, string> = {
  'akagera-np': 'Akagera National Park',
  'volcanoes-np': 'Volcanoes National Park',
  'nyungwe-np': 'Nyungwe National Park',
  'gishwati-mukura-np': 'Gishwati-Mukura',
  kigali: 'Kigali City',
  'lake-kivu': 'Lake Kivu',
};
