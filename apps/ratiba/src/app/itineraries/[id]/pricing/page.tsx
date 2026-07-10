'use client';

import { Button } from '@repo/ui/button';
import { Checkbox } from '@repo/ui/checkbox';
import { Input } from '@repo/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import {
  AlertTriangle,
  ArrowRight,
  Building,
  Calculator,
  Car,
  Check,
  Loader2,
  Pencil,
  Plane,
  Plus,
  Sparkles,
  Trash2,
  TreePine,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useBuilder } from '@/components/itinerary-builder/builder-context';
import type {
  AccommodationAlternative,
  BuilderDay,
  ExtraOption,
  ExtraPriceUnit,
  PricingRow,
} from '@/types/itinerary-types';
import { useMemo, useState } from 'react';
import { useDebounce } from '@repo/ui/use-debounce';
import { trpc } from '@/lib/trpc';
import { addDays } from 'date-fns';
import type { ParkFeeCategory, PricingBreakdown, WarningKind } from '@/lib/pricing-engine';
import { deriveMealPlan } from '@/lib/pricing-engine';

type LineSource = 'accommodation' | 'park_fee' | 'activity' | 'vehicle' | 'transfer';

const CATEGORY_META: Record<LineSource, { label: string; icon: typeof Building }> = {
  accommodation: { label: 'Accommodation', icon: Building },
  park_fee: { label: 'Park fees', icon: TreePine },
  activity: { label: 'Activities', icon: Sparkles },
  vehicle: { label: 'Vehicle', icon: Car },
  transfer: { label: 'Transfers', icon: Plane },
};

export default function PricingPage() {
  const params = useParams();
  const id = params.id as string;

  const {
    pricingRows,
    setPricingRows,
    extras,
    setExtras,
    inclusions,
    setInclusions,
    exclusions,
    setExclusions,
    showPaymentDetails,
    setShowPaymentDetails,
    useAutoPricing,
    setUseAutoPricing,
    vehicleId,
    setVehicleId,
    markupPct,
    setMarkupPct,
    pickupTransferId,
    setPickupTransferId,
    dropoffTransferId,
    setDropoffTransferId,
    days,
    setDays,
    travelerGroups,
    startDate,
  } = useBuilder();

  const handleAddRow = () => {
    setPricingRows([
      ...pricingRows,
      {
        id: Math.random().toString(36).substr(2, 9),
        count: 1,
        type: 'Adult',
        unitPrice: 0,
      },
    ]);
  };

  const handleRemoveRow = (rowId: string) => {
    setPricingRows(pricingRows.filter((row) => row.id !== rowId));
  };

  const handleUpdateRow = (rowId: string, field: keyof PricingRow, value: any) => {
    setPricingRows(pricingRows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  };

  const handleAddExtra = () => {
    setExtras([
      ...extras,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: '',
        price: 0,
        priceUnit: 'per_person',
        // Any extra that's added is shown as an optional add-on. There's no
        // separate "select" step; a non-empty name is what makes it appear.
        selected: true,
      },
    ]);
  };

  const handleRemoveExtra = (extraId: string) => {
    setExtras(extras.filter((extra) => extra.id !== extraId));
  };

  const handleUpdateExtra = (extraId: string, field: keyof ExtraOption, value: any) => {
    setExtras(extras.map((extra) => (extra.id === extraId ? { ...extra, [field]: value } : extra)));
  };

  const handleExtraUnitChange = (extraId: string, unit: ExtraPriceUnit) => {
    setExtras(
      extras.map((extra) =>
        extra.id === extraId
          ? {
              ...extra,
              priceUnit: unit,
              price: unit === 'free' ? 0 : extra.price,
              customUnitLabel: unit === 'custom' ? (extra.customUnitLabel ?? '') : undefined,
            }
          : extra,
      ),
    );
  };

  // --- Auto pricing engine ---
  const totalPax = useMemo(
    () => travelerGroups.reduce((sum, g) => sum + g.count, 0),
    [travelerGroups],
  );

  const travelerBreakdown = useMemo(() => {
    const counts = new Map<ParkFeeCategory, number>();
    for (const group of travelerGroups) {
      if (group.type === 'Baby') continue;
      const category: ParkFeeCategory =
        group.type === 'Child' ? 'non_resident_child' : 'non_resident_adult';
      counts.set(category, (counts.get(category) ?? 0) + group.count);
    }
    return Array.from(counts, ([category, count]) => ({ category, count }));
  }, [travelerGroups]);

  const dayInputs = useMemo(() => {
    if (!startDate || days.length === 0) return [];
    return days.map((d, idx) => ({
      dayNumber: d.dayNumber,
      date: addDays(startDate, idx).toISOString(),
      accommodationId: d.accommodation,
      accommodationName: d.accommodationName ?? null,
      // Board basis comes from the day's meals (B/L/D), not a separate field.
      mealPlan: deriveMealPlan(d.meals),
      rooms: (d.rooms ?? []).map((r) => ({
        roomType: (r.roomType ?? null) as 'single' | 'double' | 'triple' | 'quad' | 'family' | null,
        pax: r.pax,
      })),
      parkId:
        d.destination &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(d.destination)
          ? d.destination
          : null,
      destinationName: d.destinationName ?? null,
      activities: d.activities.map((a) => ({
        libraryId: a.libraryId ?? null,
        name: a.name ?? null,
        isOptional: a.isOptional,
      })),
    }));
  }, [days, startDate]);

  const computeQuery = trpc.pricing.compute.useQuery(
    {
      days: dayInputs,
      pax: totalPax,
      travelerCategory: 'non_resident_adult',
      travelerBreakdown,
      vehicleId,
      pickupTransferId,
      dropoffTransferId,
      markupPct,
      currency: 'USD',
    },
    {
      enabled: useAutoPricing && dayInputs.length > 0 && totalPax > 0,
    },
  );

  const { data: vehicles = [] } = trpc.rateCards.vehicles.list.useQuery();
  const { data: transferOptions = [] } = trpc.rateCards.transferRates.list.useQuery();
  const { data: pricingDefaults } = trpc.rateCards.settings.get.useQuery();

  // Group line items by category for the breakdown view.
  const groupedLines = useMemo(() => {
    const data = computeQuery.data;
    const order: LineSource[] = ['accommodation', 'park_fee', 'activity', 'vehicle', 'transfer'];
    if (!data)
      return [] as Array<{
        source: LineSource;
        subtotal: number;
        items: PricingBreakdown['lineItems'];
      }>;
    return order
      .map((source) => {
        const items = data.lineItems.filter((li) => li.source === source);
        const subtotal = items.reduce((sum, li) => sum + li.totalCost, 0);
        return { source, subtotal, items };
      })
      .filter((g) => g.items.length > 0);
  }, [computeQuery.data]);

  // Totals
  const manualRowsTotal = pricingRows.reduce((acc, row) => acc + row.count * row.unitPrice, 0);
  const extrasTotal = extras.filter((e) => e.name.trim()).reduce((acc, e) => acc + e.price, 0);
  const autoSellTotal = computeQuery.data?.sellTotal ?? 0;
  const tripTotal: number | null = useAutoPricing
    ? computeQuery.data
      ? autoSellTotal
      : null
    : manualRowsTotal;
  // The safari total stands on its own. Optional extras are shown separately
  // as add-ons and are NOT summed into the quote total.
  const grandTotal = tripTotal;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-6">
        <div>
          <h2 className="font-serif text-3xl font-bold text-stone-900">Pricing & Inclusions</h2>
          <p className="mt-1 text-stone-500">Manage trip costs and optional add-ons.</p>
        </div>
        <div className="flex flex-col items-end gap-1 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm shadow-sm">
          <div className="flex items-center gap-4">
            <span className="font-bold text-stone-700">Total Quote Value:</span>
            {grandTotal == null ? (
              <span className="flex items-center gap-2 text-sm font-medium text-stone-400">
                <Calculator className="h-3.5 w-3.5 animate-pulse" />
                Computing…
              </span>
            ) : (
              <span className="text-xl font-bold text-green-700">
                $ {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
          {extrasTotal > 0 && (
            <span className="text-xs font-medium text-stone-500">
              + ${extrasTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} in optional
              add-ons
            </span>
          )}
        </div>
      </div>

      {/* Pricing mode toggle */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between rounded-t-xl border-b border-stone-100 bg-stone-50/50 px-6 py-4">
          <h3 className="flex items-center gap-2 font-bold text-stone-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
              1
            </span>
            Trip Pricing
          </h3>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
              <Checkbox
                checked={useAutoPricing}
                onCheckedChange={(c) => setUseAutoPricing(c === true)}
              />
              <Calculator className="h-3.5 w-3.5 text-emerald-700" />
              Use auto pricing (rate cards)
            </label>
          </div>
        </div>

        {useAutoPricing ? (
          <AutoPricingSection
            vehicleId={vehicleId}
            setVehicleId={setVehicleId}
            pickupTransferId={pickupTransferId}
            setPickupTransferId={setPickupTransferId}
            dropoffTransferId={dropoffTransferId}
            setDropoffTransferId={setDropoffTransferId}
            markupPct={markupPct}
            setMarkupPct={setMarkupPct}
            vehicles={vehicles}
            transferOptions={transferOptions}
            pricingDefaults={pricingDefaults}
            startDate={startDate}
            dayInputs={dayInputs}
            totalPax={totalPax}
            computeQuery={computeQuery}
            groupedLines={groupedLines}
          />
        ) : (
          <ManualPricingSection
            pricingRows={pricingRows}
            onAddRow={handleAddRow}
            onRemoveRow={handleRemoveRow}
            onUpdateRow={handleUpdateRow}
          />
        )}
      </div>

      <div className="flex flex-col items-end gap-3 pr-2">
        <div className="flex items-start gap-2">
          <Checkbox
            id="show-payment-details"
            checked={showPaymentDetails}
            onCheckedChange={(checked) => setShowPaymentDetails(checked === true)}
            className="mt-0.5 border-stone-300 data-[state=checked]:border-stone-900 data-[state=checked]:bg-stone-900"
          />
          <label htmlFor="show-payment-details" className="cursor-pointer text-right select-none">
            <span className="block text-sm font-medium text-stone-600">
              Show payment details after the client confirms
            </span>
            <span className="block text-xs text-stone-400">
              On confirm, the client sees the payment methods from your Settings. Off keeps them
              hidden.
            </span>
          </label>
        </div>
      </div>

      {/* Accommodation Alternatives — only shown when at least one day has them */}
      <AccommodationAlternativesSection days={days} setDays={setDays} />

      {/* Extras Section */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="rounded-t-xl border-b border-stone-100 bg-stone-50/50 px-6 py-4">
          <h3 className="flex items-center gap-2 font-bold text-stone-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
              2
            </span>
            Optional Extras
          </h3>
        </div>

        <div className="grid grid-cols-12 gap-4 border-b border-stone-100 bg-stone-50/30 px-6 py-3 text-xs font-bold tracking-wide text-stone-500 uppercase">
          <div className="col-span-5">Option</div>
          <div className="col-span-3">Price</div>
          <div className="col-span-4">Pricing unit</div>
        </div>

        <div className="space-y-3 p-6">
          {extras.map((extra) => {
            const isFree = extra.priceUnit === 'free';
            return (
              <div key={extra.id} className="grid grid-cols-12 items-start gap-4">
                <div className="col-span-5">
                  <ExtraNameField
                    value={extra.name}
                    onChange={(val) => handleUpdateExtra(extra.id, 'name', val)}
                  />
                </div>
                <div className="col-span-3">
                  {isFree ? (
                    <div className="flex h-9 items-center rounded-md border border-stone-200 bg-stone-100 px-3 text-sm text-stone-400">
                      Free
                    </div>
                  ) : (
                    <div className="relative">
                      <span className="absolute top-2.5 left-3 text-sm font-medium text-stone-500">
                        $
                      </span>
                      <Input
                        type="number"
                        value={extra.price}
                        onChange={(e) =>
                          handleUpdateExtra(extra.id, 'price', parseFloat(e.target.value) || 0)
                        }
                        className="border-stone-200 bg-stone-50 pl-7 shadow-none"
                      />
                    </div>
                  )}
                </div>
                <div className="col-span-4 flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <Select
                      value={extra.priceUnit ?? 'per_person'}
                      onValueChange={(val) =>
                        handleExtraUnitChange(extra.id, val as ExtraPriceUnit)
                      }
                    >
                      <SelectTrigger className="border-stone-200 bg-stone-50 shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_person">Per person</SelectItem>
                        <SelectItem value="per_group">Per group</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="custom">Custom…</SelectItem>
                      </SelectContent>
                    </Select>
                    {extra.priceUnit === 'custom' && (
                      <Input
                        value={extra.customUnitLabel ?? ''}
                        onChange={(e) =>
                          handleUpdateExtra(extra.id, 'customUnitLabel', e.target.value)
                        }
                        placeholder="e.g. per night, per vehicle"
                        className="h-9 border-stone-200 bg-stone-50 text-sm shadow-none"
                      />
                    )}
                  </div>
                  <button
                    className="rounded-md p-2 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    onClick={() => handleRemoveExtra(extra.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-b-xl border-t border-stone-100 bg-stone-50 p-4">
          <Button
            variant="outline"
            className="w-full justify-center gap-2 border-dashed bg-white text-stone-600 shadow-sm hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900"
            onClick={handleAddExtra}
          >
            <Plus className="h-4 w-4" />
            Add optional extra
          </Button>
        </div>
      </div>

      {/* Inclusions & Exclusions Section */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="rounded-t-xl border-b border-stone-100 bg-stone-50/50 px-6 py-4">
          <h3 className="flex items-center gap-2 font-bold text-stone-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
              3
            </span>
            Inclusions & Exclusions
          </h3>
        </div>

        <div className="grid grid-cols-1 divide-y divide-stone-100 md:grid-cols-2 md:divide-x md:divide-y-0">
          {/* Inclusions */}
          <div className="space-y-4 p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                <Plus className="h-4 w-4 text-green-600" />
              </div>
              <h4 className="text-sm font-bold tracking-wider text-stone-700 uppercase">
                What's Included
              </h4>
            </div>
            <InclusionList
              items={inclusions}
              onUpdate={setInclusions}
              placeholder="Add inclusion (e.g. Park Fees)"
            />
          </div>

          {/* Exclusions */}
          <div className="space-y-4 p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
              <h4 className="text-sm font-bold tracking-wider text-stone-700 uppercase">
                What's Excluded
              </h4>
            </div>
            <InclusionList
              items={exclusions}
              onUpdate={setExclusions}
              placeholder="Add exclusion (e.g. Flight)"
              isExclusion
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Link href={`/itineraries/${id}/preview`}>
          <Button className="bg-green-600 px-8 text-white shadow-md shadow-green-600/20 hover:bg-green-700">
            Next: Preview & Edit <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// --- Accommodation alternatives -------------------------------------------

const titleCaseWords = (s: string) =>
  s
    .split(/\s+/)
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : ''))
    .join(' ');

function roomSummary(rooms: AccommodationAlternative['rooms']): string {
  if (!rooms || rooms.length === 0) return 'Rooms not set';
  return rooms
    .map((r) => `${r.roomType ? titleCaseWords(r.roomType) : 'Room'}${r.pax ? ` · ${r.pax} pax` : ''}`)
    .join(', ');
}

function mealSummary(meals: AccommodationAlternative['meals']): string {
  if (!meals) return 'Room only';
  const parts = [
    meals.breakfast ? 'Breakfast' : null,
    meals.lunch ? 'Lunch' : null,
    meals.dinner ? 'Dinner' : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Room only';
}

function AccommodationAlternativesSection({
  days,
  setDays,
}: {
  days: BuilderDay[];
  setDays: React.Dispatch<React.SetStateAction<BuilderDay[]>>;
}) {
  // Flatten every alternative across days, keeping its day for context.
  const rows = days.flatMap((day) =>
    (day.alternatives ?? []).map((alt) => ({ day, alt })),
  );

  if (rows.length === 0) return null;

  const updateAlt = (
    dayId: string,
    altId: string,
    patch: Partial<AccommodationAlternative>,
  ) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? {
              ...d,
              alternatives: (d.alternatives ?? []).map((a) =>
                a.id === altId ? { ...a, ...patch } : a,
              ),
            }
          : d,
      ),
    );
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="rounded-t-xl border-b border-stone-100 bg-stone-50/50 px-6 py-4">
        <h3 className="flex items-center gap-2 font-bold text-stone-800">
          <Building className="h-4 w-4 text-stone-500" />
          Accommodation Alternatives
        </h3>
        <p className="mt-1 text-xs text-stone-500">
          Set how much each alternative changes the price. Use a negative number for a cheaper
          option (e.g. -200) or a positive one for an upgrade. Leave blank to keep it at the same
          price.
        </p>
      </div>

      <div className="hidden grid-cols-12 gap-4 border-b border-stone-100 bg-stone-50/30 px-6 py-3 text-xs font-bold tracking-wide text-stone-500 uppercase md:grid">
        <div className="col-span-4">Accommodation</div>
        <div className="col-span-3">Room &amp; meal plan</div>
        <div className="col-span-5">Additional price</div>
      </div>

      <div className="divide-y divide-stone-100">
        {rows.map(({ day, alt }) => (
          <div
            key={alt.id}
            className="grid grid-cols-1 items-start gap-4 px-6 py-4 md:grid-cols-12"
          >
            <div className="md:col-span-4">
              <div className="text-xs font-semibold text-stone-400">Day {day.dayNumber}</div>
              <div className="font-medium text-stone-800">
                {alt.accommodationName || 'Accommodation'}
              </div>
            </div>

            <div className="text-sm text-stone-500 md:col-span-3">
              <div>{roomSummary(alt.rooms)}</div>
              <div className="text-xs text-stone-400">{mealSummary(alt.meals)}</div>
            </div>

            <div className="flex items-center gap-2 md:col-span-5">
              <div className="relative w-32">
                <span className="absolute top-2.5 left-3 text-sm font-medium text-stone-500">$</span>
                <Input
                  type="number"
                  value={alt.additionalPrice ?? ''}
                  onChange={(e) =>
                    updateAlt(day.id, alt.id, {
                      additionalPrice: e.target.value === '' ? null : parseFloat(e.target.value),
                    })
                  }
                  placeholder="0.00"
                  className="border-stone-200 bg-stone-50 pl-7 shadow-none"
                />
              </div>
              <Input
                value={alt.priceUnitLabel ?? ''}
                onChange={(e) => updateAlt(day.id, alt.id, { priceUnitLabel: e.target.value })}
                placeholder="e.g. per person / per night"
                className="h-9 flex-1 border-stone-200 bg-stone-50 text-sm shadow-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Auto-pricing section -------------------------------------------------

function AutoPricingSection({
  vehicleId,
  setVehicleId,
  pickupTransferId,
  setPickupTransferId,
  dropoffTransferId,
  setDropoffTransferId,
  markupPct,
  setMarkupPct,
  vehicles,
  transferOptions,
  pricingDefaults,
  startDate,
  dayInputs,
  totalPax,
  computeQuery,
  groupedLines,
}: {
  vehicleId: string | null;
  setVehicleId: (v: string | null) => void;
  pickupTransferId: string | null;
  setPickupTransferId: (v: string | null) => void;
  dropoffTransferId: string | null;
  setDropoffTransferId: (v: string | null) => void;
  markupPct: number;
  setMarkupPct: (v: number) => void;
  vehicles: Array<{ id: string; name: string; perDayRate: string | number }>;
  transferOptions: Array<{ id: string; name: string; mode: 'per_vehicle' | 'per_pax' }>;
  pricingDefaults: { defaultMarkupPct: string | number } | null | undefined;
  startDate: Date | undefined;
  dayInputs: Array<unknown>;
  totalPax: number;
  computeQuery: {
    isLoading: boolean;
    data: PricingBreakdown | undefined;
  };
  groupedLines: Array<{
    source: LineSource;
    subtotal: number;
    items: PricingBreakdown['lineItems'];
  }>;
}) {
  return (
    <div className="space-y-5 p-6">
      {/* Trip-wide auto settings */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-semibold tracking-wide text-stone-500 uppercase">
            Vehicle (per-day)
          </label>
          <select
            value={vehicleId ?? ''}
            onChange={(e) => setVehicleId(e.target.value || null)}
            className="h-9 w-full rounded-md border border-stone-200 bg-stone-50 px-2 text-sm"
          >
            <option value="">— none —</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} (${Number(v.perDayRate)}/day)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold tracking-wide text-stone-500 uppercase">
            Pickup transfer
          </label>
          <select
            value={pickupTransferId ?? ''}
            onChange={(e) => setPickupTransferId(e.target.value || null)}
            className="h-9 w-full rounded-md border border-stone-200 bg-stone-50 px-2 text-sm"
          >
            <option value="">— none —</option>
            {transferOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.mode === 'per_pax' ? 'per pax' : 'flat'})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold tracking-wide text-stone-500 uppercase">
            Dropoff transfer
          </label>
          <select
            value={dropoffTransferId ?? ''}
            onChange={(e) => setDropoffTransferId(e.target.value || null)}
            className="h-9 w-full rounded-md border border-stone-200 bg-stone-50 px-2 text-sm"
          >
            <option value="">— none —</option>
            {transferOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold tracking-wide text-stone-500 uppercase">
            Markup % on cost
          </label>
          <Input
            type="number"
            value={markupPct}
            onChange={(e) => setMarkupPct(Number(e.target.value) || 0)}
            className="border-stone-200 bg-stone-50 shadow-none"
          />
          {pricingDefaults && Number(pricingDefaults.defaultMarkupPct) !== markupPct && (
            <button
              onClick={() => setMarkupPct(Number(pricingDefaults.defaultMarkupPct))}
              className="mt-1 text-xs text-stone-500 hover:text-stone-700 hover:underline"
            >
              reset to default ({Number(pricingDefaults.defaultMarkupPct)}%)
            </button>
          )}
        </div>
      </div>

      {/* Pre-conditions */}
      {!startDate && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Set a tour start date in the day-by-day step. Without it the engine can't pick a season.
          </span>
        </div>
      )}

      {startDate && totalPax === 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>No travelers set. Add traveler groups in Tour details.</span>
        </div>
      )}

      {startDate && totalPax > 0 && dayInputs.length === 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>No days defined yet. Add days in the day-by-day step.</span>
        </div>
      )}

      {computeQuery.isLoading && startDate && totalPax > 0 && dayInputs.length > 0 && (
        <p className="text-sm text-stone-500">Computing…</p>
      )}

      {computeQuery.data && (
        <div className="space-y-3">
          {computeQuery.data.warnings.length > 0 && (
            <WarningsList warnings={computeQuery.data.warnings} />
          )}

          {/* Grouped breakdown */}
          <div className="space-y-3">
            {groupedLines.map((group) => {
              const meta = CATEGORY_META[group.source];
              const Icon = meta.icon;
              return (
                <div
                  key={group.source}
                  className="overflow-hidden rounded-md border border-stone-200"
                >
                  <div className="flex items-center justify-between bg-stone-50 px-4 py-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                      <Icon className="h-4 w-4 text-stone-500" />
                      {meta.label}
                    </span>
                    <span className="text-sm font-medium text-stone-700">
                      ${group.subtotal.toLocaleString()}
                    </span>
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-stone-100">
                      {group.items.map((li, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-stone-700">
                            {li.label}
                            {li.missing && (
                              <span className="ml-2 text-xs text-amber-600">({li.missing})</span>
                            )}
                          </td>
                          <td className="w-20 px-4 py-2 text-right text-stone-500">
                            {li.quantity > 1 ? `× ${li.quantity}` : ''}
                          </td>
                          <td className="w-24 px-4 py-2 text-right text-stone-500">
                            ${li.unitCost.toLocaleString()}
                          </td>
                          <td className="w-24 px-4 py-2 text-right font-medium text-stone-800">
                            ${li.totalCost.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>

          {/* Totals card */}
          <div className="rounded-md border border-stone-200 bg-white">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-stone-100">
                  <td className="px-4 py-2 font-semibold text-stone-700">Cost subtotal</td>
                  <td className="w-32 px-4 py-2 text-right font-semibold text-stone-700">
                    ${computeQuery.data.costSubtotal.toLocaleString()}
                  </td>
                </tr>
                <tr className="border-b border-stone-100">
                  <td className="px-4 py-2 text-stone-600">
                    Markup ({computeQuery.data.markupPct}%)
                  </td>
                  <td className="px-4 py-2 text-right text-stone-600">
                    ${computeQuery.data.markupAmount.toLocaleString()}
                  </td>
                </tr>
                <tr className="bg-emerald-50/40">
                  <td className="px-4 py-3 text-base font-bold text-emerald-700">Sell total</td>
                  <td className="px-4 py-3 text-right text-lg font-bold text-emerald-700">
                    ${computeQuery.data.sellTotal.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-xs text-stone-500" colSpan={1}>
                    Per pax (× {computeQuery.data.pax})
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-stone-600">
                    ${computeQuery.data.sellPerPax.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Manual pricing section -----------------------------------------------

function ManualPricingSection({
  pricingRows,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
}: {
  pricingRows: PricingRow[];
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  onUpdateRow: (id: string, field: keyof PricingRow, value: any) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-12 gap-4 border-b border-stone-100 bg-stone-50/30 px-6 py-3 text-xs font-bold tracking-wide text-stone-500 uppercase">
        <div className="col-span-5">Travelers & Type</div>
        <div className="col-span-3">Unit Price</div>
        <div className="col-span-4">Total</div>
      </div>

      <div className="space-y-3 p-6">
        {pricingRows.map((row) => (
          <div key={row.id} className="grid grid-cols-12 items-center gap-4">
            <div className="col-span-5 flex items-center gap-3">
              <Select
                value={row.count.toString()}
                onValueChange={(val) => onUpdateRow(row.id, 'count', parseInt(val))}
              >
                <SelectTrigger className="w-20 border-stone-200 bg-stone-50 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-stone-400">x</span>
              <div className="flex-1">
                <Select value={row.type} onValueChange={(val) => onUpdateRow(row.id, 'type', val)}>
                  <SelectTrigger className="border-stone-200 bg-stone-50 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Adult">Adult</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                    <SelectItem value="Child">Child</SelectItem>
                    <SelectItem value="Baby">Baby</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="col-span-3">
              <div className="relative">
                <span className="absolute top-2.5 left-3 text-sm font-medium text-stone-500">
                  $
                </span>
                <Input
                  type="number"
                  value={row.unitPrice}
                  onChange={(e) =>
                    onUpdateRow(row.id, 'unitPrice', parseFloat(e.target.value) || 0)
                  }
                  className="border-stone-200 bg-stone-50 pl-7 shadow-none"
                />
              </div>
            </div>
            <div className="col-span-4 flex items-center justify-between pl-4">
              <span className="text-lg font-bold text-stone-900">
                ${' '}
                {(row.count * row.unitPrice).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </span>
              <button
                className="rounded-md p-2 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
                onClick={() => onRemoveRow(row.id)}
                disabled={pricingRows.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-b-xl border-t border-stone-100 bg-stone-50 p-4">
        <Button
          variant="outline"
          className="w-full justify-center gap-2 border-dashed bg-white text-stone-600 shadow-sm hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900"
          onClick={onAddRow}
        >
          <Plus className="h-4 w-4" />
          Add another price line
        </Button>
      </div>
    </>
  );
}

// --- Warnings -------------------------------------------------------------

const WARNING_FIX: Record<WarningKind, { tab: string | null; label: string } | null> = {
  missing_room_meal: { tab: null, label: 'Set in day-by-day' },
  room_pax_mismatch: { tab: null, label: 'Check room mix' },
  missing_room_capacity: { tab: 'hotels', label: 'Set room capacity' },
  no_season: { tab: 'seasons', label: 'Add season band' },
  missing_hotel_rate: { tab: 'hotels', label: 'Add hotel rate' },
  missing_park_fee: { tab: 'parks', label: 'Add park fee' },
  missing_park_ancillary_no_vehicle: { tab: 'vehicles', label: 'Select vehicle' },
  missing_activity_rate: { tab: 'activities', label: 'Add activity rate' },
  missing_vehicle: { tab: 'vehicles', label: 'Check vehicle' },
  missing_transfer: { tab: 'transfers', label: 'Check transfer' },
};

function WarningsList({ warnings }: { warnings: PricingBreakdown['warnings'] }) {
  return (
    <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      <div className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4" /> Missing rate data
      </div>
      <ul className="space-y-1.5">
        {warnings.map((w, i) => {
          const fix = WARNING_FIX[w.kind];
          return (
            <li key={i} className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span>{w.message}</span>
              {fix?.tab ? (
                <Link
                  href={`/rate-cards?tab=${fix.tab}`}
                  className="shrink-0 rounded-md border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-medium text-amber-800 hover:bg-amber-100"
                >
                  {fix.label} →
                </Link>
              ) : fix ? (
                <span className="shrink-0 text-[11px] text-amber-700">{fix.label}</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// --- Optional-extra name field --------------------------------------------
function ExtraNameField({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const utils = trpc.useUtils();
  const createExtra = trpc.extras.create.useMutation();
  const updateExtra = trpc.extras.update.useMutation();
  const deleteExtra = trpc.extras.delete.useMutation();

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  // Which saved option is being renamed inline, and its draft text/error.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const q = value.trim();
  const debouncedQuery = useDebounce(q, 300);
  const { data: results = [], isFetching } = trpc.extras.search.useQuery(
    { query: debouncedQuery, limit: 8 },
    { enabled: open, placeholderData: (prev) => prev, staleTime: 60 * 1000 },
  );

  const isPending = q !== debouncedQuery || isFetching;
  // Offer to save the typed name only when it isn't already in the catalog.
  const showCreate =
    q.length > 0 && !isPending && !results.some((e) => e.name.toLowerCase() === q.toLowerCase());

  const select = (name: string) => {
    onChange(name);
    setOpen(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!q || creating) return;
    setCreating(true);
    try {
      const created = await createExtra.mutateAsync({ name: q });
      utils.extras.search.invalidate();
      select(created.name);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
  };

  const saveEdit = async (id: string, oldName: string) => {
    const next = editName.trim();
    if (!next) return;
    if (next === oldName) {
      cancelEdit();
      return;
    }
    try {
      const updated = await updateExtra.mutateAsync({ id, name: next });
      await utils.extras.search.invalidate();
      // Keep the current proposal in sync when it referenced the old name.
      if (value === oldName) onChange(updated.name);
      cancelEdit();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Could not rename');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteExtra.mutateAsync({ id });
    await utils.extras.search.invalidate();
    if (editingId === id) cancelEdit();
  };

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setOpen(false);
          setEditingId(null);
          setEditError(null);
        }
      }}
    >
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="e.g. Airport Transfer"
        className="border-stone-200 bg-stone-50 shadow-none"
      />
      {open && (results.length > 0 || showCreate) && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-stone-200 bg-white py-1 shadow-lg">
          {results.map((e) =>
            editingId === e.id ? (
              <div key={e.id} className="px-2 py-1.5">
                <div className="flex items-center gap-1">
                  <Input
                    autoFocus
                    value={editName}
                    onChange={(ev) => setEditName(ev.target.value)}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter') {
                        ev.preventDefault();
                        saveEdit(e.id, e.name);
                      } else if (ev.key === 'Escape') {
                        ev.preventDefault();
                        cancelEdit();
                      }
                    }}
                    className="h-8 border-stone-200 text-sm shadow-none"
                  />
                  <button
                    type="button"
                    onClick={() => saveEdit(e.id, e.name)}
                    disabled={updateExtra.isPending}
                    className="shrink-0 rounded-md p-1.5 text-green-600 hover:bg-green-50 disabled:opacity-60"
                    title="Save"
                  >
                    {updateExtra.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="shrink-0 rounded-md p-1.5 text-stone-400 hover:bg-stone-100"
                    title="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {editError && <p className="mt-1 px-1 text-xs text-red-500">{editError}</p>}
              </div>
            ) : (
              <div key={e.id} className="group flex items-center pr-1 hover:bg-stone-50">
                <button
                  type="button"
                  onClick={() => select(e.name)}
                  className="flex flex-1 items-center px-3 py-2 text-left text-sm text-stone-700"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0',
                      value === e.name ? 'text-green-600 opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="truncate">{e.name}</span>
                </button>
                {!e.isGlobal && (
                  <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => startEdit(e.id, e.name)}
                      className="rounded-md p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
                      title="Rename"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(e.id)}
                      className="rounded-md p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ),
          )}
          {showCreate && (
            <button
              type="button"
              disabled={creating}
              onClick={handleCreate}
              className="flex w-full items-center px-3 py-2 text-left text-sm text-green-600 hover:bg-green-50 disabled:opacity-60"
            >
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4 shrink-0" />
              )}
              Save &ldquo;{q}&rdquo; to your options
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// --- Inclusion/Exclusion helpers ------------------------------------------

function InclusionList({
  items,
  onUpdate,
  placeholder,
  isExclusion = false,
}: {
  items: string[];
  onUpdate: (items: string[]) => void;
  placeholder: string;
  isExclusion?: boolean;
}) {
  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="group flex items-start gap-2 rounded-lg border border-stone-100 bg-stone-50 p-2.5 text-sm text-stone-600 transition-colors hover:border-stone-200"
          >
            <span
              className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${isExclusion ? 'bg-red-400' : 'bg-green-400'}`}
            />
            <span className="flex-1 leading-snug">{item}</span>
            <button
              onClick={() => onUpdate(items.filter((_, i) => i !== idx))}
              className="text-stone-300 opacity-0 transition-all group-hover:opacity-100 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="relative">
        <NewItemInput onAdd={(val) => onUpdate([...items, val])} placeholder={placeholder} />
      </div>
    </div>
  );
}

function NewItemInput({
  onAdd,
  placeholder,
}: {
  onAdd: (val: string) => void;
  placeholder: string;
}) {
  const [val, setVal] = useState('');
  return (
    <div className="flex gap-2">
      <Input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && val.trim()) {
            onAdd(val.trim());
            setVal('');
          }
        }}
        placeholder={placeholder}
        className="h-9 border-stone-200 bg-white text-xs"
      />
      <Button
        size="sm"
        variant="outline"
        className="h-9 border-stone-200 px-3 text-stone-500 hover:bg-green-50 hover:text-green-600"
        onClick={() => {
          if (val.trim()) {
            onAdd(val.trim());
            setVal('');
          }
        }}
        disabled={!val.trim()}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
