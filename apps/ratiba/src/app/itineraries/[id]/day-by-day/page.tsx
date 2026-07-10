'use client';

import { Button } from '@repo/ui/button';
import { ArrowRight, CheckCircle, Plus, Users, X } from 'lucide-react';
import { DayTable } from '@/components/itinerary-builder/day-table';
import { DatePicker } from '@repo/ui/date-picker';
import { Input } from '@repo/ui/input';
import React, { useCallback, useEffect, useRef } from 'react';
import { addDays, format } from 'date-fns';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import type { TravelerGroup } from '@/types/itinerary-types';
import { Combobox } from '@repo/ui/combobox';
import { airports } from '@/lib/data/itinerary-data';
import { useBuilder } from '@/components/itinerary-builder/builder-context';
import { CreatableAsyncCombobox } from '@/components/itinerary-builder/creatable-async-combobox';
import { searchPlaces, parseGeoValue, buildGeoValue } from '@/lib/geocoding';
import { CountryPicker } from '@/components/itinerary-builder/country-picker';

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
    startCityCoordinates,
    setStartCityCoordinates,
    endCity,
    setEndCity,
    endCityCoordinates,
    setEndCityCoordinates,
    transferIncluded,
    setTransferIncluded,
    pickupPoint,
    setPickupPoint,
    country,
    countries,
    setCountries,
    travelerGroups,
    setTravelerGroups,
    tourType,
    setTourType,
  } = useBuilder();

  const totalPax = travelerGroups.reduce((sum, g) => sum + g.count, 0);

  const updateGroup = (id: string, field: 'count' | 'type', value: any) => {
    setTravelerGroups((groups: TravelerGroup[]) =>
      groups.map((g) => (g.id === id ? { ...g, [field]: value } : g)),
    );
  };

  const addGroup = () => {
    setTravelerGroups((groups: TravelerGroup[]) => [
      ...groups,
      { id: Math.random().toString(36).substr(2, 9), count: 1, type: 'Adult' },
    ]);
  };

  const removeGroup = (id: string) => {
    setTravelerGroups((groups: TravelerGroup[]) => groups.filter((g) => g.id !== id));
  };

  const searchCities = useCallback(
    async (query: string) => {
      if (!query) return [];
      const countryList = countries.length > 0 ? countries : country ? [country] : undefined;
      const results = await searchPlaces(query, countryList);
      return results.map((r) => ({
        value: buildGeoValue(r.latitude, r.longitude, r.name),
        label: r.displayName,
      }));
    },
    [countries, country],
  );

  const handleCitySelect = useCallback(
    (
      value: string,
      setCity: React.Dispatch<React.SetStateAction<string>>,
      setCoords: React.Dispatch<React.SetStateAction<[number, number] | null>>,
    ) => {
      if (!value) {
        setCity('');
        setCoords(null);
        return;
      }
      const geo = parseGeoValue(value);
      if (geo) {
        setCity(geo.name);
        setCoords([geo.lng, geo.lat]);
      } else {
        setCity(value);
        setCoords(null);
      }
    },
    [],
  );

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
        <CountryPicker value={countries} onChange={setCountries} />
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
                  Tour Starts In
                  {country && (
                    <span className="ml-2 text-green-600 capitalize">({country})</span>
                  )}
                </label>
                <CreatableAsyncCombobox
                  value={startCity || null}
                  onChange={(v) => handleCitySelect(v, setStartCity, setStartCityCoordinates)}
                  onSearch={searchCities}
                  initialLabel={startCity || null}
                  placeholder="Search start city..."
                  createLabel="Use"
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
                <CreatableAsyncCombobox
                  value={endCity || null}
                  onChange={(v) => handleCitySelect(v, setEndCity, setEndCityCoordinates)}
                  onSearch={searchCities}
                  initialLabel={endCity || null}
                  placeholder="Search end city..."
                  createLabel="Use"
                  className="border-stone-200 bg-stone-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">
                <Users className="h-4 w-4" />
                Travelers
                <span className="text-stone-400 normal-case">({totalPax} total)</span>
              </label>
              <div className="space-y-3">
                {travelerGroups.map((group) => (
                  <div key={group.id} className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      className="w-20 border-stone-200 bg-stone-50"
                      value={group.count}
                      onChange={(e) => updateGroup(group.id, 'count', parseInt(e.target.value) || 1)}
                    />
                    <Select
                      value={group.type}
                      onValueChange={(value) => updateGroup(group.id, 'type', value)}
                    >
                      <SelectTrigger className="flex-1 border-stone-200 bg-stone-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Adult">Adult</SelectItem>
                        <SelectItem value="Senior">Senior</SelectItem>
                        <SelectItem value="Child">Child</SelectItem>
                        <SelectItem value="Baby">Baby</SelectItem>
                      </SelectContent>
                    </Select>
                    {travelerGroups.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => removeGroup(group.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-dashed border-stone-300 text-stone-600 hover:bg-stone-50"
                  onClick={addGroup}
                >
                  <Plus className="h-3 w-3" />
                  Add Group
                </Button>
              </div>
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

            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
                Tour Type
              </label>
              <Select value={tourType} onValueChange={setTourType}>
                <SelectTrigger className="w-[200px] border-stone-200 bg-stone-50">
                  <SelectValue placeholder="Select tour type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Private Tour">Private Tour</SelectItem>
                  <SelectItem value="Group Tour">Group Tour</SelectItem>
                  <SelectItem value="Self-drive">Self-drive</SelectItem>
                </SelectContent>
              </Select>
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
          startDate={startDate}
          countries={countries.length > 0 ? countries : country ? [country] : undefined}
          totalPax={totalPax}
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
