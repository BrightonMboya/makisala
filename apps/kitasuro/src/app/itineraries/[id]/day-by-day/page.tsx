'use client';

import { Button } from '@repo/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { DayTable } from '@/components/itinerary-builder/day-table';
import { DatePicker } from '@repo/ui/date-picker';
import { useEffect, useMemo, useRef } from 'react';
import { addDays, format } from 'date-fns';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { Combobox } from '@repo/ui/combobox';
import { Checkbox } from '@repo/ui/checkbox';
import { Label } from '@repo/ui/label';
import { airports } from '@/lib/data/itinerary-data';
import { CITIES } from '@/lib/data/cities';
import { useBuilder } from '@/components/itinerary-builder/builder-context';
import { getAllNationalParks } from '@/app/itineraries/actions';
import { useQuery } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/query-keys';

export default function DayByDayPage() {
  const params = useParams();
  const id = params.id as string;

  const {
    days,
    setDays,
    startDate,
    setStartDate,
    startCity,
    setStartCity,
    endCity,
    setEndCity,
    transferIncluded,
    setTransferIncluded,
    pickupPoint,
    setPickupPoint,
    country,
  } = useBuilder();

  // Use React Query for caching national parks (accommodations are loaded on-demand via AsyncCombobox)
  const { data: parksData } = useQuery({
    queryKey: queryKeys.nationalParks,
    queryFn: getAllNationalParks,
    staleTime: staleTimes.nationalParks,
  });

  // Memoize the transformed destinations list
  const destinationsList = useMemo(
    () => (parksData || []).map((p: any) => ({ value: p.id, label: p.name })),
    [parksData],
  );

  // Filter cities based on tour country
  // Note: Use city.value (lowercase) as the value prop because cmdk lowercases values internally
  const citiesList = useMemo(() => {
    const countryLower = country?.toLowerCase() || null;
    const filtered = countryLower
      ? CITIES.filter((city) => city.country === countryLower)
      : CITIES;
    return filtered.map((city) => ({ value: city.value, label: city.label }));
  }, [country]);

  // Track if we've already updated dates for this startDate
  const lastStartDateRef = useRef<Date | undefined>(undefined);

  // Update dates whenever start date changes (but only once per change)
  useEffect(() => {
    if (!startDate || lastStartDateRef.current === startDate) return;
    lastStartDateRef.current = startDate;

    setDays((currentDays) =>
      currentDays.map((day, index) => ({
        ...day,
        date: format(addDays(startDate, index), 'MMM d'),
      })),
    );
  }, [startDate, setDays]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 pb-20">
      <div className="flex items-center justify-between border-b border-stone-200 pb-6">
        <div>
          <h2 className="font-serif text-3xl font-bold text-stone-900">Day-by-Day Itinerary</h2>
          <p className="mt-1 text-stone-500">Build the daily schedule and manage activities.</p>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm shadow-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-700">Destinations:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-lg">
                {(() => {
                  const city = (startCity || '').toLowerCase();
                  if (
                    city.includes('tanzania') ||
                    city.includes('arusha') ||
                    city.includes('kilimanjaro')
                  )
                    return '🇹🇿';
                  if (
                    city.includes('botswana') ||
                    city.includes('maun') ||
                    city.includes('okavango')
                  )
                    return '🇧🇼';
                  if (city.includes('kenya') || city.includes('nairobi')) return '🇰🇪';
                  if (city.includes('uganda') || city.includes('entebbe')) return '🇺🇬';
                  return '🇷🇼'; // Default
                })()}
              </span>
              <span className="text-stone-600">
                {(() => {
                  const city = (startCity || '').toLowerCase();
                  if (
                    city.includes('tanzania') ||
                    city.includes('arusha') ||
                    city.includes('kilimanjaro')
                  )
                    return 'Tanzania';
                  if (
                    city.includes('botswana') ||
                    city.includes('maun') ||
                    city.includes('okavango')
                  )
                    return 'Botswana';
                  if (city.includes('kenya') || city.includes('nairobi')) return 'Kenya';
                  if (city.includes('uganda') || city.includes('entebbe')) return 'Uganda';
                  return 'Rwanda'; // Default
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 rounded-t-xl border-b border-stone-100 bg-stone-50/50 px-6 py-4 text-sm font-bold text-green-800">
          <CheckCircle className="h-4 w-4" />
          Tour Logistics: Arrival & Start
        </div>

        <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
          {/* Left Column: Dates & Location */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
                Start Date
              </label>
              <DatePicker date={startDate} setDate={setStartDate} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
                Tour Starts In
                {country && (
                  <span className="ml-2 text-green-600 capitalize">({country})</span>
                )}
              </label>
              <Combobox
                items={citiesList}
                value={startCity}
                onChange={setStartCity}
                placeholder="Select start city"
                className="border-stone-200 bg-stone-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
                Tour Ends In
                {country && (
                  <span className="ml-2 text-green-600 capitalize">({country})</span>
                )}
              </label>
              <Combobox
                items={citiesList}
                value={endCity}
                onChange={setEndCity}
                placeholder="Select end city"
                className="border-stone-200 bg-stone-50"
              />
            </div>
          </div>

          {/* Right Column: Transfers & Options */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
                Arrival Transfer
              </label>
              <div className="flex items-center gap-3">
                <Select value={transferIncluded} onValueChange={setTransferIncluded}>
                  <SelectTrigger className="w-[140px] border-stone-200 bg-stone-50">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="included">Included</SelectItem>
                    <SelectItem value="excluded">Excluded</SelectItem>
                  </SelectContent>
                </Select>
                {transferIncluded === 'included' && (
                  <Combobox
                    items={airports}
                    value={pickupPoint}
                    onChange={setPickupPoint}
                    placeholder="Select airport"
                    className="flex-1 border-stone-200 bg-stone-50"
                  />
                )}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-200 p-3 transition-colors hover:bg-stone-50">
                <Checkbox id="arrange-accommodation" />
                <span className="text-sm font-medium text-stone-700">
                  Arrange accommodation before tour start
                </span>
              </Label>
              <Label className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-200 p-3 transition-colors hover:bg-stone-50">
                <Checkbox id="client-arrives-early" />
                <span className="text-sm font-medium text-stone-700">
                  Client arrives days before tour start
                </span>
              </Label>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl font-bold text-stone-900">Itinerary Schedule</h3>
          <div className="text-sm text-stone-500">{days.length} Days Total</div>
        </div>
        <DayTable
          days={days}
          setDays={setDays}
          destinations={destinationsList}
          startDate={startDate}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50/50 p-4">
        <div className="flex items-center gap-3 text-sm font-medium text-green-800">
          <div className="rounded-full bg-green-100 p-2 text-green-700">
            <CheckCircle className="h-4 w-4" />
          </div>
          Tour Conclusion & Departure
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-stone-700">
          <span className="text-stone-500">Ends:</span>
          <span>
            {startDate && days.length > 0
              ? format(addDays(startDate, days.length - 1), 'PPP')
              : '—'}
          </span>
          <span className="text-stone-300">|</span>
          <span>{endCity || 'End city not set'}</span>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <Link href={`/itineraries/${id}/pricing`}>
          <Button
            size="lg"
            className="bg-green-700 px-8 py-6 text-base shadow-md shadow-green-900/10 hover:bg-green-800"
          >
            Proceed to Pricing <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
