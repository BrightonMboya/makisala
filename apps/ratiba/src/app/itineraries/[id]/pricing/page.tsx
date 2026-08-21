'use client';

import { Button } from '@repo/ui/button';
import { Checkbox } from '@repo/ui/checkbox';
import { Combobox } from '@repo/ui/combobox';
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
  Lock,
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
import { inferDayPricingFlags } from '@/lib/day-pricing-inference';
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
import { keepPreviousData } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { addDays } from 'date-fns';
import type { ParkFeeCategory, PricingBreakdown, WarningKind } from '@/lib/pricing-engine';
import { deriveMealPlan } from '@/lib/pricing-engine';
import { formatMoney } from '@/components/invoices/form-types';

type LineSource = 'accommodation' | 'park_fee' | 'activity' | 'vehicle' | 'transfer' | 'internal';

const CURRENCY_SYMBOLS: Record<'USD' | 'EUR', string> = { USD: '$', EUR: '€' };

// Preset pricing units for optional extras. The combobox is creatable, so users
// can also type any custom unit (e.g. "per night", "per vehicle").
const EXTRA_UNIT_PRESETS = [
  { value: 'per_person', label: 'Per person' },
  { value: 'per_group', label: 'Per group' },
  { value: 'free', label: 'Free' },
];

// Preset pricing units for accommodation alternatives. Same creatable-combobox
// pattern as EXTRA_UNIT_PRESETS: anything the user types becomes a `custom`
// basis with that text as the unit shown to the client.
const ALT_UNIT_PRESETS = [
  { value: 'flat', label: 'Total for the night' },
  { value: 'per_person', label: 'Per person' },
  { value: 'per_room', label: 'Per room' },
];

// Built-in traveler categories for manual pricing rows. Orgs can add their own
// (e.g. "Infant", "Guide"), persisted in traveler_category_library so they're
// available on every itinerary (and in the Day-by-Day traveler groups).
const TRAVELER_CATEGORIES = ['Adult', 'Senior', 'Child', 'Baby'] as const;

const CATEGORY_META: Record<LineSource, { label: string; icon: typeof Building }> = {
  accommodation: { label: 'Accommodation', icon: Building },
  park_fee: { label: 'Park fees', icon: TreePine },
  activity: { label: 'Activities', icon: Sparkles },
  vehicle: { label: 'Vehicle', icon: Car },
  transfer: { label: 'Transfers', icon: Plane },
  internal: { label: 'Internal costs (operator only)', icon: Lock },
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
    useAutoPricing,
    setUseAutoPricing,
    vehicleId,
    setVehicleId,
    vehicleCount,
    setVehicleCount,
    guideId,
    setGuideId,
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
    currency,
    setCurrency,
    pricingOverrides,
    setPricingOverrides,
    internalCostLines,
    setInternalCostLines,
  } = useBuilder();

  const setLineOverride = (key: string, value: number) => {
    setPricingOverrides({ ...pricingOverrides, [key]: value });
  };

  const clearLineOverride = (key: string) => {
    const next = { ...pricingOverrides };
    delete next[key];
    setPricingOverrides(next);
  };

  const addInternalCostLine = (label: string, amount: number, quantity = 1) => {
    setInternalCostLines([
      ...internalCostLines,
      { id: crypto.randomUUID(), label, amount, quantity },
    ]);
  };

  const updateInternalCostLine = (id: string, amount: number) => {
    setInternalCostLines(internalCostLines.map((l) => (l.id === id ? { ...l, amount } : l)));
  };

  const updateInternalCostLineQuantity = (id: string, quantity: number) => {
    setInternalCostLines(
      internalCostLines.map((l) => (l.id === id ? { ...l, quantity: Math.max(1, quantity) } : l)),
    );
  };

  const deleteInternalCostLine = (id: string) => {
    setInternalCostLines(internalCostLines.filter((l) => l.id !== id));
  };

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

  // Activities marked "Optional" in the day-by-day step are priced here, not
  // in the activity modal — one place to set a price, regardless of which day
  // it's on. Derived live from `days`, not a separate copy, so it can't drift.
  const activityOptions = useMemo(
    () =>
      days.flatMap((day) =>
        day.activities
          .filter((a) => a.isOptional)
          .map((activity) => ({
            dayId: day.id,
            dayNumber: day.dayNumber,
            activity,
            label: `Day ${day.dayNumber}: ${activity.name || 'Untitled activity'}${
              activity.location ? `, ${activity.location}` : ''
            }`,
          })),
      ),
    [days],
  );

  const updateActivityOptionPrice = (dayId: string, activityId: string, patch: any) => {
    setDays((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? {
              ...day,
              activities: day.activities.map((a) => (a.id === activityId ? { ...a, ...patch } : a)),
            }
          : day,
      ),
    );
  };

  // Removing an option here just un-marks the activity as optional — it stays
  // on the day, it's just no longer priced as an add-on.
  const removeActivityOption = (dayId: string, activityId: string) => {
    updateActivityOptionPrice(dayId, activityId, { isOptional: false });
  };

  // Org catalog of custom pricing units, so a unit typed on one itinerary is
  // suggested on every future one (like moments / extra names).
  const utils = trpc.useUtils();
  const { data: orgUnits = [] } = trpc.extraUnits.list.useQuery();
  const createExtraUnit = trpc.extraUnits.create.useMutation();

  // The pricing unit is edited with a creatable combobox: the presets map to the
  // known units, and anything the user types is stored as a `custom` unit label
  // and persisted to the org catalog for reuse.
  const handleExtraUnitChange = (extraId: string, value: string) => {
    const isPreset = value === 'per_person' || value === 'per_group' || value === 'free';
    setExtras(
      extras.map((extra) =>
        extra.id === extraId
          ? {
              ...extra,
              priceUnit: isPreset ? (value as ExtraPriceUnit) : 'custom',
              price: value === 'free' ? 0 : extra.price,
              customUnitLabel: isPreset ? undefined : value,
            }
          : extra,
      ),
    );
    const custom = value.trim();
    if (!isPreset && custom) {
      createExtraUnit.mutate(
        { name: custom },
        { onSuccess: () => utils.extraUnits.list.invalidate() },
      );
    }
  };

  // Current combobox value for an extra: the preset key, or the freeform label
  // when it's a custom unit.
  const extraUnitValue = (extra: ExtraOption): string =>
    extra.priceUnit === 'custom'
      ? (extra.customUnitLabel?.trim() ?? '')
      : (extra.priceUnit ?? 'per_person');

  // Combobox options: built-in presets, then the org's saved custom units, then
  // any custom unit already used on this itinerary (so it shows before the
  // catalog refetch lands). Deduped case-insensitively by label.
  const extraUnitItems = useMemo(() => {
    const byLabel = new Map<string, { value: string; label: string }>();
    for (const preset of EXTRA_UNIT_PRESETS) byLabel.set(preset.label.toLowerCase(), preset);
    const add = (label: string) => {
      const trimmed = label.trim();
      if (trimmed && !byLabel.has(trimmed.toLowerCase())) {
        byLabel.set(trimmed.toLowerCase(), { value: trimmed, label: trimmed });
      }
    };
    for (const u of orgUnits) add(u.name);
    for (const e of extras)
      if (e.priceUnit === 'custom' && e.customUnitLabel) add(e.customUnitLabel);
    return Array.from(byLabel.values());
  }, [orgUnits, extras]);

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
    return days.map((d, idx) => {
      const inferred = inferDayPricingFlags(days, idx);
      return {
        dayNumber: d.dayNumber,
        date: addDays(startDate, idx).toISOString(),
        accommodationId: d.accommodation,
        accommodationName: d.accommodationName ?? null,
        // Board basis comes from the day's meals (B/L/D), not a separate field.
        mealPlan: deriveMealPlan(d.meals),
        rooms: (d.rooms ?? []).map((r) => ({
          roomType: (r.roomType ?? null) as 'single' | 'double' | 'triple' | 'quad' | 'family' | null,
          pax: r.pax,
          children: r.children ?? 0,
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
        dayKind: inferred.dayKind,
        isTransit: inferred.isTransit,
        mealCostId: inferred.mealCostId,
        flightId: d.transfer?.flightRateId ?? null,
      };
    });
  }, [days, startDate]);

  const computeQuery = trpc.pricing.compute.useQuery(
    {
      days: dayInputs,
      pax: totalPax,
      travelerCategory: 'non_resident_adult',
      travelerBreakdown,
      vehicleId,
      vehicleCount,
      guideId,
      pickupTransferId,
      dropoffTransferId,
      markupPct,
      currency,
      overrides: pricingOverrides,
      internalCostLines,
    },
    {
      enabled: useAutoPricing && dayInputs.length > 0 && totalPax > 0,
      // Keep showing the last computed breakdown while a recompute is in
      // flight (e.g. after a single field edit) instead of unmounting it —
      // avoids the layout shift from the whole section disappearing/reappearing.
      placeholderData: keepPreviousData,
    },
  );

  const { data: vehicles = [] } = trpc.rateCards.vehicles.list.useQuery();
  const { data: guides = [] } = trpc.rateCards.guides.list.useQuery();
  const { data: transferOptions = [] } = trpc.rateCards.transferRates.list.useQuery();
  const { data: activityRateOptions = [] } = trpc.rateCards.activityRates.listAll.useQuery();
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
  const extrasTotal =
    extras.filter((e) => e.name.trim()).reduce((acc, e) => acc + e.price, 0) +
    activityOptions.reduce((acc, { activity }) => acc + (activity.price ?? 0), 0);
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
        <div className="flex items-center gap-3">
          <Select value={currency} onValueChange={(v) => setCurrency(v as 'USD' | 'EUR')}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
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
                  {formatMoney(grandTotal, currency)}
                </span>
              )}
            </div>
            {extrasTotal > 0 && (
              <span className="text-xs font-medium text-stone-500">
                + {formatMoney(extrasTotal, currency)} in optional add-ons
              </span>
            )}
          </div>
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
            vehicleCount={vehicleCount}
            setVehicleCount={setVehicleCount}
            guideId={guideId}
            setGuideId={setGuideId}
            guides={guides}
            pickupTransferId={pickupTransferId}
            setPickupTransferId={setPickupTransferId}
            dropoffTransferId={dropoffTransferId}
            setDropoffTransferId={setDropoffTransferId}
            markupPct={markupPct}
            setMarkupPct={setMarkupPct}
            vehicles={vehicles}
            transferOptions={transferOptions}
            activityRateOptions={activityRateOptions}
            pricingDefaults={pricingDefaults}
            startDate={startDate}
            dayInputs={dayInputs}
            totalPax={totalPax}
            computeQuery={computeQuery}
            groupedLines={groupedLines}
            currency={currency}
            onSetLineOverride={setLineOverride}
            onClearLineOverride={clearLineOverride}
            onAddInternalCostLine={addInternalCostLine}
            onUpdateInternalCostLine={updateInternalCostLine}
            onUpdateInternalCostLineQuantity={updateInternalCostLineQuantity}
            onDeleteInternalCostLine={deleteInternalCostLine}
          />
        ) : (
          <ManualPricingSection
            pricingRows={pricingRows}
            onAddRow={handleAddRow}
            onRemoveRow={handleRemoveRow}
            onUpdateRow={handleUpdateRow}
            currency={currency}
          />
        )}
      </div>

      {/* Accommodation Alternatives — only shown when at least one day has them */}
      <AccommodationAlternativesSection days={days} setDays={setDays} currency={currency} />

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
          {activityOptions.map(({ dayId, activity, label }) => (
            <div key={activity.id} className="grid grid-cols-12 items-start gap-4">
              <div className="col-span-5">
                <div className="flex h-9 items-center gap-2 rounded-md border border-stone-200 bg-stone-100 px-3 text-sm text-stone-700">
                  <span className="shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
                    Day-by-day
                  </span>
                  <span className="truncate">{label}</span>
                </div>
              </div>
              <div className="col-span-3">
                <div className="relative">
                  <span className="absolute top-2.5 left-3 text-sm font-medium text-stone-500">
                    {CURRENCY_SYMBOLS[currency]}
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={activity.price ?? ''}
                    onChange={(e) => {
                      const parsed = Number(e.target.value);
                      updateActivityOptionPrice(dayId, activity.id, {
                        price:
                          e.target.value === '' || Number.isNaN(parsed)
                            ? null
                            : Math.max(0, parsed),
                      });
                    }}
                    placeholder="On request"
                    className="border-stone-200 bg-stone-50 pl-7 shadow-none"
                  />
                </div>
              </div>
              <div className="col-span-4 flex items-start gap-2">
                <select
                  value={activity.priceUnit ?? 'per_person'}
                  onChange={(e) =>
                    updateActivityOptionPrice(dayId, activity.id, { priceUnit: e.target.value })
                  }
                  className="h-9 flex-1 rounded-md border border-stone-200 bg-stone-50 px-2 text-sm text-stone-700"
                >
                  <option value="per_person">per person</option>
                  <option value="per_group">per group</option>
                </select>
                <button
                  className="rounded-md p-2 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  onClick={() => removeActivityOption(dayId, activity.id)}
                  title="Un-mark as optional"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

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
                        {CURRENCY_SYMBOLS[currency]}
                      </span>
                      <Input
                        type="number"
                        value={extra.price === 0 ? '' : extra.price}
                        onChange={(e) => {
                          const parsed = parseFloat(e.target.value);
                          handleUpdateExtra(
                            extra.id,
                            'price',
                            e.target.value === '' || Number.isNaN(parsed) ? 0 : parsed,
                          );
                        }}
                        placeholder="0.00"
                        className="border-stone-200 bg-stone-50 pl-7 shadow-none"
                      />
                    </div>
                  )}
                </div>
                <div className="col-span-4 flex items-start gap-2">
                  <div className="flex-1">
                    <Combobox
                      items={extraUnitItems}
                      value={extraUnitValue(extra)}
                      onChange={(val) => handleExtraUnitChange(extra.id, val)}
                      placeholder="Pricing unit"
                      className="border-stone-200 bg-stone-50 shadow-none"
                      creatable
                      createLabel="Add unit"
                    />
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
    .map(
      (r) => `${r.roomType ? titleCaseWords(r.roomType) : 'Room'}${r.pax ? ` · ${r.pax} pax` : ''}`,
    )
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
  currency,
}: {
  days: BuilderDay[];
  setDays: React.Dispatch<React.SetStateAction<BuilderDay[]>>;
  currency: 'USD' | 'EUR';
}) {
  // Flatten every alternative across days, keeping its day for context.
  const rows = days.flatMap((day) => (day.alternatives ?? []).map((alt) => ({ day, alt })));

  // Same org-wide catalog of custom pricing units used for optional extras, so
  // a unit typed here is also suggested there (and vice versa).
  const utils = trpc.useUtils();
  const { data: orgUnits = [] } = trpc.extraUnits.list.useQuery();
  const createExtraUnit = trpc.extraUnits.create.useMutation();

  const updateAlt = (dayId: string, altId: string, patch: Partial<AccommodationAlternative>) => {
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

  // The pricing unit is edited with a creatable combobox: the presets map to
  // the known bases, and anything else typed is stored as a `custom` basis
  // with that text as the unit label and persisted to the org catalog.
  const handleAltUnitChange = (dayId: string, altId: string, value: string) => {
    const isPreset = value === 'flat' || value === 'per_person' || value === 'per_room';
    updateAlt(dayId, altId, {
      priceBasis: isPreset ? (value as AccommodationAlternative['priceBasis']) : 'custom',
      priceUnitLabel: isPreset ? null : value,
    });
    const custom = value.trim();
    if (!isPreset && custom) {
      createExtraUnit.mutate(
        { name: custom },
        { onSuccess: () => utils.extraUnits.list.invalidate() },
      );
    }
  };

  // Current combobox value for an alternative: the preset key, or the
  // freeform label when it's a custom basis.
  const altUnitValue = (alt: AccommodationAlternative): string =>
    alt.priceBasis === 'custom' ? (alt.priceUnitLabel?.trim() ?? '') : (alt.priceBasis ?? 'flat');

  // Combobox options: built-in presets, then the org's saved custom units,
  // then any custom unit already used among these alternatives (so it shows
  // before the catalog refetch lands). Deduped case-insensitively by label.
  const altUnitItems = useMemo(() => {
    const byLabel = new Map<string, { value: string; label: string }>();
    for (const preset of ALT_UNIT_PRESETS) byLabel.set(preset.label.toLowerCase(), preset);
    const add = (label: string) => {
      const trimmed = label.trim();
      if (trimmed && !byLabel.has(trimmed.toLowerCase())) {
        byLabel.set(trimmed.toLowerCase(), { value: trimmed, label: trimmed });
      }
    };
    for (const u of orgUnits) add(u.name);
    for (const { alt } of rows)
      if (alt.priceBasis === 'custom' && alt.priceUnitLabel) add(alt.priceUnitLabel);
    return Array.from(byLabel.values());
  }, [orgUnits, rows]);

  if (rows.length === 0) return null;

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
                <span className="absolute top-2.5 left-3 text-sm font-medium text-stone-500">
                  {CURRENCY_SYMBOLS[currency]}
                </span>
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
              {/* Drives both the charge and the unit the client is shown, so
                  the two cannot disagree — including a typed-in custom unit,
                  which bills once (like "total for the night") and shows
                  exactly the text typed. An alternative covers one night, so
                  a multi-night swap is already one row per night: "per night"
                  needs no option here. */}
              <div className="flex-1">
                <Combobox
                  items={altUnitItems}
                  value={altUnitValue(alt)}
                  onChange={(val) => handleAltUnitChange(day.id, alt.id, val)}
                  placeholder="Pricing unit"
                  className="border-stone-200 bg-stone-50 shadow-none"
                  creatable
                  createLabel="Add unit"
                />
              </div>
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
  vehicleCount,
  setVehicleCount,
  guideId,
  setGuideId,
  pickupTransferId,
  setPickupTransferId,
  dropoffTransferId,
  setDropoffTransferId,
  markupPct,
  setMarkupPct,
  vehicles,
  transferOptions,
  activityRateOptions,
  pricingDefaults,
  startDate,
  dayInputs,
  totalPax,
  computeQuery,
  groupedLines,
  currency,
  onSetLineOverride,
  onClearLineOverride,
  onAddInternalCostLine,
  onUpdateInternalCostLine,
  onUpdateInternalCostLineQuantity,
  onDeleteInternalCostLine,
  guides,
}: {
  vehicleId: string | null;
  setVehicleId: (v: string | null) => void;
  vehicleCount: number;
  setVehicleCount: (v: number) => void;
  guideId: string | null;
  setGuideId: (v: string | null) => void;
  pickupTransferId: string | null;
  setPickupTransferId: (v: string | null) => void;
  dropoffTransferId: string | null;
  setDropoffTransferId: (v: string | null) => void;
  markupPct: number;
  setMarkupPct: (v: number) => void;
  vehicles: Array<{ id: string; name: string; perDayRate: string | number }>;
  guides: Array<{ id: string; name: string; touringRate: string | number }>;
  transferOptions: Array<{
    id: string;
    name: string;
    mode: 'per_vehicle' | 'per_pax';
    rate: string | number;
    currency: string;
  }>;
  activityRateOptions: Array<{
    id: string;
    activityName: string | null;
    chargeBasis: 'per_person' | 'per_group';
    rate: string | number;
    currency: string;
  }>;
  pricingDefaults: { defaultMarkupPct: string | number } | null | undefined;
  startDate: Date | undefined;
  dayInputs: Array<unknown>;
  totalPax: number;
  computeQuery: {
    isLoading: boolean;
    isFetching: boolean;
    data: PricingBreakdown | undefined;
  };
  groupedLines: Array<{
    source: LineSource;
    subtotal: number;
    items: PricingBreakdown['lineItems'];
  }>;
  currency: 'USD' | 'EUR';
  onSetLineOverride: (key: string, value: number) => void;
  onClearLineOverride: (key: string) => void;
  onAddInternalCostLine: (label: string, amount: number, quantity?: number) => void;
  onUpdateInternalCostLine: (id: string, amount: number) => void;
  onUpdateInternalCostLineQuantity: (id: string, quantity: number) => void;
  onDeleteInternalCostLine: (id: string) => void;
}) {
  const internalLines = computeQuery.data?.lineItems.filter((li) => li.source === 'internal') ?? [];
  const internalSubtotal = internalLines.reduce((sum, li) => sum + li.totalCost, 0);
  const [internalPickerValue, setInternalPickerValue] = useState<string | null>(null);
  const [showCustomInternalForm, setShowCustomInternalForm] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customQuantity, setCustomQuantity] = useState('1');

  const internalPickerItems = [
    { value: '__custom__', label: 'Custom (type your own)' },
    ...activityRateOptions.map((a) => ({
      value: `activity:${a.id}`,
      label: `${a.activityName?.trim() || 'Activity'} — ${
        a.chargeBasis === 'per_person' ? 'per person' : 'per group'
      } (${formatMoney(Number(a.rate), currency)})`,
    })),
    ...transferOptions.map((t) => ({
      value: `transfer:${t.id}`,
      label: `${t.name} (${t.mode === 'per_pax' ? 'per pax' : 'flat'}, ${formatMoney(Number(t.rate), currency)})`,
    })),
  ];

  const handleInternalPick = (picked: string) => {
    if (picked === '__custom__') {
      setShowCustomInternalForm(true);
      setInternalPickerValue(null);
      return;
    }
    if (picked.startsWith('activity:')) {
      const rateId = picked.slice('activity:'.length);
      const rate = activityRateOptions.find((a) => a.id === rateId);
      if (rate) {
        // Store the per-person rate as the unit cost with quantity = current
        // pax count, rather than pre-multiplying into a flat total, so the
        // operator can bump the quantity later without redoing the math.
        const quantity = rate.chargeBasis === 'per_person' ? totalPax : 1;
        onAddInternalCostLine(rate.activityName?.trim() || 'Activity', Number(rate.rate), quantity);
      }
    } else if (picked.startsWith('transfer:')) {
      const rateId = picked.slice('transfer:'.length);
      const rate = transferOptions.find((t) => t.id === rateId);
      if (rate) {
        const quantity = rate.mode === 'per_pax' ? totalPax : 1;
        onAddInternalCostLine(rate.name, Number(rate.rate), quantity);
      }
    }
    setInternalPickerValue(null);
  };

  const handleAddCustomInternalLine = () => {
    if (!customLabel.trim()) return;
    onAddInternalCostLine(
      customLabel.trim(),
      Number(customAmount) || 0,
      Math.max(1, Number(customQuantity) || 1),
    );
    setCustomLabel('');
    setCustomAmount('');
    setCustomQuantity('1');
    setShowCustomInternalForm(false);
  };

  return (
    <div className="space-y-5 p-6">
      {/* Trip-wide auto settings */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <div>
          <label className="mb-1 block text-xs font-semibold tracking-wide text-stone-500 uppercase">
            Vehicle (per-day)
          </label>
          <div className="flex gap-2">
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
            <input
              type="number"
              min={1}
              step={1}
              value={vehicleCount}
              onChange={(e) => setVehicleCount(Math.max(1, Number(e.target.value) || 1))}
              title="Number of vehicles"
              className="h-9 w-16 shrink-0 rounded-md border border-stone-200 bg-stone-50 px-2 text-center text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold tracking-wide text-stone-500 uppercase">
            Guide (priced separately from vehicle)
          </label>
          <select
            value={guideId ?? ''}
            onChange={(e) => setGuideId(e.target.value || null)}
            className="h-9 w-full rounded-md border border-stone-200 bg-stone-50 px-2 text-sm"
          >
            <option value="">— none —</option>
            {guides.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} (${Number(g.touringRate)}/touring day)
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
        <div className="relative space-y-3">
          {computeQuery.isFetching && (
            <div className="absolute top-0 right-0 flex items-center gap-1 text-xs text-stone-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              Recalculating…
            </div>
          )}
          <div
            className={cn('space-y-3 transition-opacity', computeQuery.isFetching && 'opacity-60')}
          >
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
                        {formatMoney(group.subtotal, currency)}
                      </span>
                    </div>
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-stone-100">
                        {group.items.map((li) => (
                          <tr key={li.key}>
                            <td className="px-4 py-2 text-stone-700">
                              {li.label}
                              {li.missing && (
                                <span className="ml-2 text-xs text-amber-600">({li.missing})</span>
                              )}
                              {li.occupantBreakdown && (
                                <div className="text-xs text-stone-400">{li.occupantBreakdown}</div>
                              )}
                            </td>
                            <td className="w-20 px-4 py-2 text-right text-stone-500">
                              {li.quantity > 1 ? `× ${li.quantity}` : ''}
                            </td>
                            <td className="w-28 px-4 py-2 text-right text-stone-500">
                              <EditableLineAmount
                                value={li.unitCost}
                                currency={currency}
                                overridden={li.overridden}
                                originalValue={li.originalUnitCost}
                                onChange={(v) => onSetLineOverride(li.key, v)}
                                onReset={() => onClearLineOverride(li.key)}
                              />
                            </td>
                            <td className="w-28 px-4 py-2 text-right font-medium text-stone-800">
                              <EditableLineAmount
                                value={li.totalCost}
                                currency={currency}
                                overridden={li.overridden}
                                originalValue={li.originalTotalCost}
                                onChange={(v) => onSetLineOverride(li.key, v / (li.quantity || 1))}
                                onReset={() => onClearLineOverride(li.key)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>

            {/* Internal cost lines — operator-only, never shown to the client */}
            <div className="overflow-hidden rounded-md border border-stone-200">
              <div className="flex items-center justify-between bg-stone-50 px-4 py-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                  <Lock className="h-4 w-4 text-stone-500" />
                  Internal costs (operator only)
                </span>
                <span className="text-sm font-medium text-stone-700">
                  {formatMoney(internalSubtotal, currency)}
                </span>
              </div>
              {internalLines.length > 0 && (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-stone-100">
                    {internalLines.map((li) => {
                      const id = li.key.slice('internal:'.length);
                      return (
                        <tr key={li.key}>
                          <td className="px-4 py-2 text-stone-700">{li.label}</td>
                          <td className="w-20 px-2 py-2">
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={li.quantity}
                              onChange={(e) =>
                                onUpdateInternalCostLineQuantity(
                                  id,
                                  Math.max(1, Number(e.target.value) || 1),
                                )
                              }
                              title="Quantity (e.g. pax)"
                              className="h-7 w-16 rounded-md border border-stone-200 bg-white px-1 text-center text-sm"
                            />
                          </td>
                          <td className="w-28 px-4 py-2 text-right text-stone-500">
                            <EditableLineAmount
                              value={li.unitCost}
                              currency={currency}
                              onChange={(v) => onUpdateInternalCostLine(id, v)}
                              onReset={() => {}}
                            />
                          </td>
                          <td className="w-28 px-4 py-2 text-right font-medium text-stone-800">
                            {formatMoney(li.totalCost, currency)}
                          </td>
                          <td className="w-10 px-2 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => onDeleteInternalCostLine(id)}
                              title="Remove line"
                              className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              <div className="space-y-2 p-3">
                {showCustomInternalForm ? (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Label, e.g. Zanzibar concession fee"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      className="h-8"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="h-8 w-28"
                    />
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      placeholder="Qty"
                      title="Quantity (e.g. pax)"
                      value={customQuantity}
                      onChange={(e) => setCustomQuantity(e.target.value)}
                      className="h-8 w-16"
                    />
                    <Button size="sm" onClick={handleAddCustomInternalLine}>
                      Add
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomInternalForm(false);
                        setCustomLabel('');
                        setCustomAmount('');
                        setCustomQuantity('1');
                      }}
                      className="text-stone-400 hover:text-stone-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Combobox
                    items={internalPickerItems}
                    value={internalPickerValue}
                    onChange={handleInternalPick}
                    placeholder="Add an internal cost line..."
                    className="w-full max-w-sm"
                  />
                )}
              </div>
            </div>

            {/* Totals card */}
            <div className="rounded-md border border-stone-200 bg-white">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-stone-100">
                    <td className="px-4 py-2 font-semibold text-stone-700">Cost subtotal</td>
                    <td className="w-32 px-4 py-2 text-right font-semibold text-stone-700">
                      {formatMoney(computeQuery.data.costSubtotal, currency)}
                    </td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="px-4 py-2 text-stone-600">
                      Markup ({computeQuery.data.markupPct}%)
                    </td>
                    <td className="px-4 py-2 text-right text-stone-600">
                      {formatMoney(computeQuery.data.markupAmount, currency)}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/40">
                    <td className="px-4 py-3 text-base font-bold text-emerald-700">Sell total</td>
                    <td className="px-4 py-3 text-right text-lg font-bold text-emerald-700">
                      {formatMoney(computeQuery.data.sellTotal, currency)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-xs text-stone-500" colSpan={1}>
                      Per pax (× {computeQuery.data.pax})
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-stone-600">
                      {formatMoney(computeQuery.data.sellPerPax, currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
  currency,
}: {
  pricingRows: PricingRow[];
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  onUpdateRow: (id: string, field: keyof PricingRow, value: any) => void;
  currency: 'USD' | 'EUR';
}) {
  // Same org-wide catalog of custom traveler categories used in the Day-by-Day
  // traveler groups, so a category typed here is also suggested there.
  const utils = trpc.useUtils();
  const { data: orgTravelerCategories } = trpc.travelerCategories.list.useQuery();
  const createTravelerCategory = trpc.travelerCategories.create.useMutation();

  const travelerCategoryItems = useMemo(() => {
    const set = new Set<string>(TRAVELER_CATEGORIES);
    orgTravelerCategories?.forEach((c) => set.add(c.name));
    pricingRows.forEach((row) => set.add(row.type));
    return Array.from(set).map((v) => ({ value: v, label: v }));
  }, [orgTravelerCategories, pricingRows]);

  const canonicalTravelerCategories = useMemo(() => new Set<string>(TRAVELER_CATEGORIES), []);
  const handleTravelerTypeChange = (rowId: string, value: string) => {
    onUpdateRow(rowId, 'type', value);
    const trimmed = value.trim();
    const existing = new Set(orgTravelerCategories?.map((c) => c.name) ?? []);
    if (trimmed && !canonicalTravelerCategories.has(trimmed) && !existing.has(trimmed)) {
      createTravelerCategory.mutate(
        { name: trimmed },
        { onSuccess: () => utils.travelerCategories.list.invalidate() },
      );
    }
  };

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
                <Combobox
                  items={travelerCategoryItems}
                  value={row.type}
                  onChange={(val) => handleTravelerTypeChange(row.id, val)}
                  placeholder="Category"
                  creatable
                  createLabel="Add category"
                  className="border-stone-200 bg-stone-50 shadow-none"
                />
              </div>
            </div>
            <div className="col-span-3">
              <div className="relative">
                <span className="absolute top-2.5 left-3 text-sm font-medium text-stone-500">
                  {CURRENCY_SYMBOLS[currency]}
                </span>
                <Input
                  type="number"
                  value={row.unitPrice === 0 ? '' : row.unitPrice}
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    onUpdateRow(
                      row.id,
                      'unitPrice',
                      e.target.value === '' || Number.isNaN(parsed) ? 0 : parsed,
                    );
                  }}
                  placeholder="0.00"
                  className="border-stone-200 bg-stone-50 pl-7 shadow-none"
                />
              </div>
            </div>
            <div className="col-span-4 flex items-center justify-between pl-4">
              <span className="text-lg font-bold text-stone-900">
                {formatMoney(row.count * row.unitPrice, currency)}
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
  vehicle_capacity_exceeded: { tab: 'vehicles', label: 'Add another vehicle' },
  missing_guide: { tab: null, label: 'Check guide' },
  unpriced_transfer_day: { tab: 'guides', label: 'Add guide' },
  missing_transit_fee: { tab: 'parks', label: 'Add transit rate' },
  missing_meal_rate: { tab: null, label: 'Add meal rate' },
  missing_flight_rate: { tab: null, label: 'Add flight rate' },
};

// A computed line total that the operator can click to override with a manual
// number (e.g. to fill in a "rate not configured" row on the spot). Shows a
// pencil + reset-to-computed control once overridden.
function EditableLineAmount({
  value,
  currency,
  overridden,
  originalValue,
  onChange,
  onReset,
  alwaysShowDelete,
}: {
  value: number;
  currency: 'USD' | 'EUR';
  overridden?: boolean;
  originalValue?: number;
  onChange: (value: number) => void;
  onReset: () => void;
  // For lines with no "computed" baseline (e.g. internal cost lines) - shows
  // the delete affordance unconditionally instead of only after an override.
  alwaysShowDelete?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  if (editing) {
    return (
      <Input
        autoFocus
        type="number"
        step="0.01"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const n = Number(draft);
          if (!Number.isNaN(n)) onChange(n);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') setEditing(false);
        }}
        className="h-7 w-24 border-stone-200 bg-white text-right shadow-none"
      />
    );
  }

  return (
    <button
      type="button"
      className={cn(
        'group inline-flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-stone-100',
        overridden && 'text-blue-700',
      )}
      title={
        overridden
          ? `Manually set — computed value was ${formatMoney(originalValue ?? 0, currency)}`
          : 'Click to override this amount'
      }
      onClick={() => {
        setDraft(String(value));
        setEditing(true);
      }}
    >
      {overridden && <Pencil className="h-3 w-3 opacity-60" />}
      {formatMoney(value, currency)}
      {(overridden || alwaysShowDelete) && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          className="text-stone-400 opacity-0 group-hover:opacity-100 hover:text-stone-700"
        >
          <X className="h-3 w-3" />
        </span>
      )}
    </button>
  );
}

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
      <NewItemInput
        kind={isExclusion ? 'exclusion' : 'inclusion'}
        onAdd={(val) => onUpdate([...items, val])}
        placeholder={placeholder}
      />
    </div>
  );
}

function NewItemInput({
  kind,
  onAdd,
  placeholder,
}: {
  kind: 'inclusion' | 'exclusion';
  onAdd: (val: string) => void;
  placeholder: string;
}) {
  const utils = trpc.useUtils();
  const recordUsage = trpc.inclusionExclusions.recordUsage.useMutation();
  const [val, setVal] = useState('');
  const [open, setOpen] = useState(false);

  const q = val.trim();
  // Don't search (or show the full library) until there's something to
  // narrow by — with hundreds of saved phrases, an empty/1-char query would
  // otherwise dump most of the catalog into the dropdown.
  const canSearch = q.length >= 2;
  const debouncedQuery = useDebounce(q, 300);
  const { data: results = [], isFetching } = trpc.inclusionExclusions.search.useQuery(
    { kind, query: debouncedQuery, limit: 8 },
    { enabled: open && canSearch, staleTime: 60 * 1000 },
  );

  // True while a keystroke's debounce hasn't fired yet, or the query itself
  // is still in flight — covers the whole "still searching" window.
  const isSearching = canSearch && (q !== debouncedQuery || isFetching);
  const isNew =
    canSearch && !isSearching && !results.some((r) => r.text.toLowerCase() === q.toLowerCase());

  // Adds the phrase to this tour's list and records it in the shared
  // (cross-org) library so it shows up as a suggestion on other tours too.
  const commit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    recordUsage.mutate(
      { kind, text: trimmed },
      { onSuccess: () => utils.inclusionExclusions.search.invalidate({ kind }) },
    );
    setVal('');
    setOpen(false);
  };

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={val}
            onChange={(e) => {
              setVal(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && val.trim()) {
                e.preventDefault();
                commit(val);
              } else if (e.key === 'Escape') {
                setOpen(false);
              }
            }}
            placeholder={placeholder}
            className="h-9 border-stone-200 bg-white pr-7 text-xs"
          />
          {isSearching && (
            <Loader2 className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-stone-300" />
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-9 border-stone-200 px-3 text-stone-500 hover:bg-green-50 hover:text-green-600"
          onClick={() => commit(val)}
          disabled={!val.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {open && canSearch && (results.length > 0 || isSearching || isNew) && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-stone-200 bg-white py-1 shadow-lg">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => commit(r.text)}
              className="block w-full truncate px-3 py-2 text-left text-xs text-stone-700 hover:bg-stone-50"
            >
              {r.text}
            </button>
          ))}
          {isSearching && results.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-stone-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching…
            </div>
          )}
          {isNew && (
            <button
              type="button"
              onClick={() => commit(q)}
              className="flex w-full items-center gap-2 truncate px-3 py-2 text-left text-xs text-green-600 hover:bg-green-50"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              New: {q}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
