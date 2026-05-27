'use client';

import { useState } from 'react';
import { Building, TreePine, Car, Plane, Calendar, Check, Sparkles } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { AccommodationRatesTab } from './accommodation-rates-tab';
import { ParkFeesTab } from './park-fees-tab';
import { ActivitiesTab } from './activities-tab';
import { VehiclesTab } from './vehicles-tab';
import { TransfersTab } from './transfers-tab';
import { SeasonsDefaultsTab } from './seasons-defaults-tab';

type SectionKey = 'hotels' | 'parks' | 'activities' | 'vehicles' | 'transfers' | 'seasons';

const ICONS: Record<SectionKey, typeof Building> = {
  hotels: Building,
  parks: TreePine,
  activities: Sparkles,
  vehicles: Car,
  transfers: Plane,
  seasons: Calendar,
};

export function RateCardsShell({ defaultTab }: { defaultTab: SectionKey }) {
  const [active, setActive] = useState<SectionKey>(defaultTab);

  const { data: hotelRates = [] } = trpc.rateCards.accommodationRates.listAll.useQuery();
  const { data: parkRates = [] } = trpc.rateCards.parkFeeRates.listAll.useQuery();
  const { data: activityRates = [] } = trpc.rateCards.activityRates.listAll.useQuery();
  const { data: vehicles = [] } = trpc.rateCards.vehicles.list.useQuery();
  const { data: transfers = [] } = trpc.rateCards.transferRates.list.useQuery();
  const { data: seasons = [] } = trpc.rateCards.seasons.list.useQuery();

  const hotelCount = new Set(hotelRates.map((r) => r.accommodationId)).size;
  const parkCount = new Set(parkRates.map((r) => r.parkId)).size;
  const activityCount = new Set(activityRates.map((r) => r.activityId)).size;

  const sections: {
    key: SectionKey;
    label: string;
    done: boolean;
    hint: string;
  }[] = [
    {
      key: 'hotels',
      label: 'Hotels & Camps',
      done: hotelRates.length > 0,
      hint: hotelCount > 0 ? `${hotelCount} ${hotelCount === 1 ? 'hotel' : 'hotels'}` : 'Add STO rates',
    },
    {
      key: 'parks',
      label: 'Parks',
      done: parkRates.length > 0,
      hint: parkCount > 0 ? `${parkCount} ${parkCount === 1 ? 'park' : 'parks'}` : 'Add entry fees',
    },
    {
      key: 'activities',
      label: 'Activities',
      done: activityRates.length > 0,
      hint:
        activityCount > 0
          ? `${activityCount} ${activityCount === 1 ? 'activity' : 'activities'}`
          : 'Add activity prices',
    },
    {
      key: 'vehicles',
      label: 'Vehicles',
      done: vehicles.length > 0,
      hint: vehicles.length > 0 ? `${vehicles.length} in fleet` : 'Add fleet',
    },
    {
      key: 'transfers',
      label: 'Transfers',
      done: transfers.length > 0,
      hint: transfers.length > 0 ? `${transfers.length} configured` : 'Add pickups',
    },
    {
      key: 'seasons',
      label: 'Seasons & Defaults',
      done: seasons.length > 0,
      hint: seasons.length > 0 ? `${seasons.length} seasons` : 'Define date bands',
    },
  ];

  const go = (key: SectionKey) => {
    setActive(key);
    // Update the URL for shareable deep links without a server round-trip
    // (router.replace would re-run the page server component on every tab click).
    window.history.replaceState(null, '', `/rate-cards?tab=${key}`);
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Section nav */}
      <nav className="lg:w-60 lg:shrink-0">
        <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
          {sections.map((s) => {
            const Icon = ICONS[s.key];
            const isActive = active === s.key;
            return (
              <li key={s.key} className="shrink-0 lg:shrink">
                <button
                  onClick={() => go(s.key)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                    isActive
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-transparent hover:border-stone-200 hover:bg-stone-50',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isActive ? 'text-emerald-700' : 'text-stone-400',
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-stone-800">{s.label}</span>
                    <span className="block text-xs text-stone-500">{s.hint}</span>
                  </span>
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                      s.done
                        ? 'bg-emerald-600 text-white'
                        : 'border border-stone-300 bg-white',
                    )}
                  >
                    {s.done && <Check className="h-2.5 w-2.5" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Active section */}
      <div className="min-w-0 flex-1">
        {active === 'hotels' && <AccommodationRatesTab />}
        {active === 'parks' && <ParkFeesTab />}
        {active === 'activities' && <ActivitiesTab />}
        {active === 'vehicles' && <VehiclesTab />}
        {active === 'transfers' && <TransfersTab />}
        {active === 'seasons' && <SeasonsDefaultsTab />}
      </div>
    </div>
  );
}
