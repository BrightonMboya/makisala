'use client';

import { Button } from '@repo/ui/button';
import { Checkbox } from '@repo/ui/checkbox';
import { Input } from '@repo/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { Plus, Trash2, ArrowRight, Calculator, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Combobox } from '@repo/ui/combobox';
import { commonExtras } from '@/lib/data/itinerary-data';
import { useBuilder } from '@/components/itinerary-builder/builder-context';
import type { PricingRow, ExtraOption } from '@/types/itinerary-types';
import { useMemo, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { addDays, parseISO } from 'date-fns';

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
    hidePricing,
    setHidePricing,
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
        selected: false,
      },
    ]);
  };

  const handleRemoveExtra = (extraId: string) => {
    setExtras(extras.filter((extra) => extra.id !== extraId));
  };

  const handleUpdateExtra = (extraId: string, field: keyof ExtraOption, value: any) => {
    setExtras(extras.map((extra) => (extra.id === extraId ? { ...extra, [field]: value } : extra)));
  };

  const rowsTotal = pricingRows.reduce((acc, row) => acc + row.count * row.unitPrice, 0);
  const extrasTotal = extras.filter((e) => e.selected).reduce((acc, e) => acc + e.price, 0);
  const grandTotal = rowsTotal + extrasTotal;

  // --- Auto pricing engine ---
  const totalPax = useMemo(
    () => travelerGroups.reduce((sum, g) => sum + g.count, 0),
    [travelerGroups],
  );

  const dayInputs = useMemo(() => {
    if (!startDate || days.length === 0) return [];
    return days.map((d, idx) => ({
      dayNumber: d.dayNumber,
      date: addDays(startDate, idx).toISOString(),
      accommodationId: d.accommodation,
      roomType: (d.roomType ?? null) as
        | 'single'
        | 'double'
        | 'triple'
        | 'quad'
        | 'family'
        | null,
      mealPlan: (d.mealPlan ?? null) as 'ro' | 'bb' | 'hb' | 'fb' | 'ai' | null,
      // BuilderDay.destination can be either a national-park UUID or a freeform
      // geo string. UUIDs are 36 chars with dashes — anything else gets ignored
      // for park-fee lookup.
      parkId:
        d.destination && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          d.destination,
        )
          ? d.destination
          : null,
    }));
  }, [days, startDate]);

  const computeQuery = trpc.pricing.compute.useQuery(
    {
      days: dayInputs,
      pax: totalPax,
      travelerCategory: 'non_resident_adult',
      vehicleId,
      pickupTransferId,
      dropoffTransferId,
      markupPct,
      currency: 'USD',
    },
    {
      enabled:
        useAutoPricing && dayInputs.length > 0 && totalPax > 0,
    },
  );

  const { data: vehicles = [] } = trpc.rateCards.vehicles.list.useQuery();
  const { data: transferOptions = [] } = trpc.rateCards.transferRates.list.useQuery();
  const { data: pricingDefaults } = trpc.rateCards.settings.get.useQuery();

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-6">
        <div>
          <h2 className="font-serif text-3xl font-bold text-stone-900">Pricing & Inclusions</h2>
          <p className="mt-1 text-stone-500">Manage trip costs and optional add-ons.</p>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm shadow-sm">
          <span className="font-bold text-stone-700">Total Quote Value:</span>
          <span className="text-xl font-bold text-green-700">
            $ {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Auto-pricing panel (rate-card-driven) */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between rounded-t-xl border-b border-stone-100 bg-emerald-50/50 px-6 py-4">
          <h3 className="flex items-center gap-2 font-bold text-stone-800">
            <Calculator className="h-4 w-4 text-emerald-700" />
            Auto pricing (rate cards)
          </h3>
          <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <Checkbox
              checked={useAutoPricing}
              onCheckedChange={(c) => setUseAutoPricing(c === true)}
            />
            Enable
          </label>
        </div>

        {useAutoPricing && (
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Vehicle (per-day, all-in)
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
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
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
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
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
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
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

            {!startDate && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Set a tour start date in the day-by-day step. Without it the engine can't pick a
                season.
              </div>
            )}

            {computeQuery.isLoading && startDate && (
              <p className="text-sm text-stone-500">Computing…</p>
            )}

            {computeQuery.data && (
              <div className="space-y-3">
                {computeQuery.data.warnings.length > 0 && (
                  <div className="space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertTriangle className="h-4 w-4" /> Missing rate data
                    </div>
                    <ul className="list-disc space-y-0.5 pl-5 text-xs">
                      {computeQuery.data.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="overflow-hidden rounded-md border border-stone-200">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Line</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right">Unit</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {computeQuery.data.lineItems.map((li, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2">
                            {li.label}
                            {li.missing && (
                              <span className="ml-2 text-xs text-amber-600">
                                ({li.missing})
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-stone-500">{li.quantity}</td>
                          <td className="px-3 py-2 text-right">
                            ${li.unitCost.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            ${li.totalCost.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-stone-50 text-sm">
                      <tr>
                        <td className="px-3 py-2 font-semibold" colSpan={3}>
                          Cost subtotal
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          ${computeQuery.data.costSubtotal.toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2" colSpan={3}>
                          Markup ({computeQuery.data.markupPct}%)
                        </td>
                        <td className="px-3 py-2 text-right">
                          ${computeQuery.data.markupAmount.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="border-t border-stone-200">
                        <td className="px-3 py-2 font-bold text-emerald-700" colSpan={3}>
                          Sell total
                        </td>
                        <td className="px-3 py-2 text-right text-lg font-bold text-emerald-700">
                          ${computeQuery.data.sellTotal.toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-xs text-stone-500" colSpan={3}>
                          Per-pax sell (×{computeQuery.data.pax})
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-medium text-stone-700">
                          ${computeQuery.data.sellPerPax.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!computeQuery.data) return;
                    setPricingRows(
                      travelerGroups.map((g) => ({
                        id: g.id,
                        count: g.count,
                        type: g.type,
                        unitPrice: computeQuery.data.sellPerPax,
                      })),
                    );
                  }}
                >
                  Copy per-pax sell into manual rows below
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Price Section */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between rounded-t-xl border-b border-stone-100 bg-stone-50/50 px-6 py-4">
          <h3 className="flex items-center gap-2 font-bold text-stone-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
              1
            </span>
            Trip Pricing
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
              Currency
            </span>
            <Select defaultValue="USD">
              <SelectTrigger className="h-8 w-[180px] border-stone-200 bg-white text-xs shadow-none">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">U.S. Dollar - $</SelectItem>
                <SelectItem value="EUR">Euro - €</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

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
                  onValueChange={(val) => handleUpdateRow(row.id, 'count', parseInt(val))}
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
                  <Select
                    value={row.type}
                    onValueChange={(val) => handleUpdateRow(row.id, 'type', val)}
                  >
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
                      handleUpdateRow(row.id, 'unitPrice', parseFloat(e.target.value) || 0)
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
                  onClick={() => handleRemoveRow(row.id)}
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
            onClick={handleAddRow}
          >
            <Plus className="h-4 w-4" />
            Add another price line
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pr-2">
        <Checkbox
          id="hide-total"
          checked={hidePricing}
          onCheckedChange={(checked) => setHidePricing(checked === true)}
          className="border-stone-300 data-[state=checked]:border-stone-900 data-[state=checked]:bg-stone-900"
        />
        <label
          htmlFor="hide-total"
          className="cursor-pointer text-sm font-medium text-stone-600 select-none"
        >
          Hide pricing in the final proposal
        </label>
      </div>

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
          <div className="col-span-1 text-center">Select</div>
          <div className="col-span-7">Option Details</div>
          <div className="col-span-4">Price</div>
        </div>

        <div className="space-y-3 p-6">
          {extras.map((extra) => (
            <div key={extra.id} className="grid grid-cols-12 items-center gap-4">
              <div className="col-span-1 flex justify-center">
                <Checkbox
                  checked={extra.selected}
                  onCheckedChange={(checked) => handleUpdateExtra(extra.id, 'selected', checked)}
                  className="border-stone-300 data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600"
                />
              </div>
              <div className="col-span-7">
                <Combobox
                  items={commonExtras}
                  value={extra.name}
                  onChange={(val) => handleUpdateExtra(extra.id, 'name', val)}
                  placeholder="Select or type option"
                  className="border-stone-200 bg-stone-50 shadow-none"
                />
              </div>
              <div className="col-span-4 flex items-center gap-3">
                <div className="relative flex-1">
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
                <button
                  className="rounded-md p-2 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  onClick={() => handleRemoveExtra(extra.id)}
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
