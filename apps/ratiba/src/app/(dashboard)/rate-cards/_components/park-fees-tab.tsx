'use client';

import { useMemo, useRef, useState } from 'react';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { toast } from '@repo/ui/toast';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { AsyncCombobox } from '@/components/itinerary-builder/async-combobox';

const ANCILLARY_BASES = ['per_vehicle_per_day', 'per_vehicle_once_per_visit'] as const;
type AncillaryBasis = (typeof ANCILLARY_BASES)[number];

const ANCILLARY_BASIS_LABEL: Record<AncillaryBasis, string> = {
  per_vehicle_per_day: 'Per vehicle, per day',
  per_vehicle_once_per_visit: 'Per vehicle, once per visit',
};

const CATEGORIES = [
  'non_resident_adult',
  'non_resident_child',
  'east_african_resident_adult',
  'east_african_resident_child',
  'citizen_adult',
  'citizen_child',
] as const;

type Category = (typeof CATEGORIES)[number];

const COMMON: Category[] = ['non_resident_adult', 'non_resident_child'];

const CATEGORY_LABEL: Record<Category, string> = {
  non_resident_adult: 'Non-resident adult',
  non_resident_child: 'Non-resident child',
  east_african_resident_adult: 'EA resident adult',
  east_african_resident_child: 'EA resident child',
  citizen_adult: 'Citizen adult',
  citizen_child: 'Citizen child',
};

const cellKey = (seasonId: string | null, category: Category) =>
  `${seasonId ?? 'null'}|${category}`;

export function ParkFeesTab() {
  const utils = trpc.useUtils();
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [showAddPark, setShowAddPark] = useState(false);

  const { data: seasons = [] } = trpc.rateCards.seasons.list.useQuery();
  const { data: allRates = [] } = trpc.rateCards.parkFeeRates.listAll.useQuery();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showSeasons, setShowSeasons] = useState(false);

  // Caches id -> name for parks surfaced in search.
  const searchCacheRef = useRef<Map<string, string>>(new Map());

  const parksWithRates = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of allRates) {
      if (r.parkId && !map.has(r.parkId)) map.set(r.parkId, r.parkName ?? 'Unnamed park');
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [allRates]);

  const active = selected ?? parksWithRates[0] ?? null;

  const pills = useMemo(() => {
    const list = [...parksWithRates];
    if (selected && !list.some((p) => p.id === selected.id)) list.unshift(selected);
    return list;
  }, [parksWithRates, selected]);

  const { data: rates = [], isLoading: ratesLoading } =
    trpc.rateCards.parkFeeRates.listByPark.useQuery(
      { parkId: active?.id ?? '' },
      { enabled: !!active },
    );

  const invalidate = () => {
    if (active) utils.rateCards.parkFeeRates.listByPark.invalidate({ parkId: active.id });
    utils.rateCards.parkFeeRates.listAll.invalidate();
  };

  const create = trpc.rateCards.parkFeeRates.create.useMutation({
    onSuccess: () => {
      invalidate();
      toast({ title: 'Park fee saved' });
    },
  });
  const update = trpc.rateCards.parkFeeRates.update.useMutation({
    onSuccess: () => {
      invalidate();
      toast({ title: 'Park fee updated' });
    },
  });
  const remove = trpc.rateCards.parkFeeRates.delete.useMutation({
    onSuccess: () => {
      invalidate();
      toast({ title: 'Park fee removed' });
    },
  });

  const { data: ancillaryFees = [] } = trpc.rateCards.parkAncillaryFees.listByPark.useQuery(
    { parkId: active?.id ?? '' },
    { enabled: !!active },
  );
  const invalidateAncillary = () => {
    if (active) utils.rateCards.parkAncillaryFees.listByPark.invalidate({ parkId: active.id });
    utils.rateCards.parkAncillaryFees.listAll.invalidate();
  };
  const createAncillary = trpc.rateCards.parkAncillaryFees.create.useMutation({
    onSuccess: () => {
      invalidateAncillary();
      toast({ title: 'Ancillary fee added' });
    },
  });
  const updateAncillary = trpc.rateCards.parkAncillaryFees.update.useMutation({
    onSuccess: () => {
      invalidateAncillary();
      toast({ title: 'Ancillary fee updated' });
    },
  });
  const removeAncillary = trpc.rateCards.parkAncillaryFees.delete.useMutation({
    onSuccess: () => {
      invalidateAncillary();
      toast({ title: 'Ancillary fee removed' });
    },
  });

  const addAncillary = (basis: AncillaryBasis) => {
    if (!active) return;
    createAncillary.mutate({
      parkId: active.id,
      name:
        basis === 'per_vehicle_per_day' ? 'Vehicle entry fee' : 'Crater descent fee',
      chargeBasis: basis,
      rate: 0,
    });
  };

  const rateMap = useMemo(() => {
    const m = new Map<string, { id: string; perPersonRate: number }>();
    for (const r of rates) {
      m.set(cellKey(r.seasonId, r.category as Category), {
        id: r.id,
        perPersonRate: Number(r.perPersonRate),
      });
    }
    return m;
  }, [rates]);

  // One column per distinct season NAME (plus a year-round column). A name can
  // cover several date bands, so each column maps to all its band ids.
  const columns = useMemo(() => {
    const cols: { label: string; ids: (string | null)[] }[] = [
      { label: 'Year-round', ids: [null] },
    ];
    if (showSeasons) {
      const order: string[] = [];
      const byName = new Map<string, string[]>();
      for (const s of seasons) {
        if (!byName.has(s.name)) {
          byName.set(s.name, []);
          order.push(s.name);
        }
        byName.get(s.name)!.push(s.id);
      }
      for (const name of order) cols.push({ label: name, ids: byName.get(name)! });
    }
    return cols;
  }, [showSeasons, seasons]);

  const visibleCategories = showAllCategories ? CATEGORIES : COMMON;

  const cellValue = (ids: (string | null)[], category: Category) => {
    for (const id of ids) {
      const r = rateMap.get(cellKey(id, category));
      if (r) return r.perPersonRate;
    }
    return undefined;
  };

  const selectPark = (id: string, name: string) => {
    setSelected({ id, name });
    setShowAddPark(false);
  };

  const commitCell = (ids: (string | null)[], category: Category, raw: string) => {
    if (!active) return;
    const value = Number(raw);
    const isEmpty = raw.trim() === '' || !value || value <= 0;
    // Fan the value out to every band that shares this season name.
    for (const seasonId of ids) {
      const existing = rateMap.get(cellKey(seasonId, category));
      if (isEmpty) {
        if (existing) remove.mutate({ id: existing.id });
      } else if (existing) {
        if (value !== existing.perPersonRate)
          update.mutate({ id: existing.id, perPersonRate: value });
      } else {
        create.mutate({ parkId: active.id, seasonId, category, perPersonRate: value });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Park entry fees</CardTitle>
        <CardDescription>
          Per-person entry fees by traveler category. Most parks are flat year-round. Turn on
          seasonal columns only for parks that charge differently in peak season.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Park selector */}
        <div className="flex flex-wrap items-center gap-2">
          {pills.map((p) => (
            <button
              key={p.id}
              onClick={() => selectPark(p.id, p.name)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                active?.id === p.id
                  ? 'border-emerald-300 bg-emerald-50 font-medium text-emerald-900'
                  : 'border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50',
              )}
            >
              {p.name}
            </button>
          ))}

          {showAddPark ? (
            <div className="flex items-center gap-1">
              <div className="w-64">
                <AsyncCombobox
                  value={null}
                  onChange={(id) => {
                    if (!id) return;
                    const name = searchCacheRef.current.get(id);
                    if (name) {
                      selectPark(id, name);
                    } else {
                      utils.nationalParks.getById
                        .fetch({ id })
                        .then((p) => p && selectPark(p.id, p.name));
                    }
                  }}
                  onSearch={async (q) => {
                    const res = await utils.nationalParks.search.fetch({ query: q, limit: 10 });
                    res.forEach((p) => searchCacheRef.current.set(p.id, p.name));
                    return res.map((p) => ({ value: p.id, label: p.name }));
                  }}
                  placeholder="Search parks"
                  className="w-full"
                />
              </div>
              <button
                onClick={() => setShowAddPark(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddPark(true)}
              className="flex items-center gap-1 rounded-full border border-dashed border-stone-300 px-3 py-1.5 text-sm text-stone-500 hover:border-stone-400 hover:bg-stone-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add park
            </button>
          )}
        </div>

        {!active && (
          <div className="rounded-md border border-dashed border-stone-200 px-4 py-10 text-center">
            <p className="text-sm text-stone-500">Add a park to start recording its fees.</p>
          </div>
        )}

        {active && ratesLoading && (
          <div className="flex items-center justify-center gap-2 rounded-md border border-stone-200 py-12 text-sm text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading fees…
          </div>
        )}

        {active && !ratesLoading && (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-md border border-stone-200">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="sticky left-0 z-10 bg-stone-50 px-3 py-2 text-left">
                      Traveler
                    </th>
                    {columns.map((c) => (
                      <th key={c.label} className="px-3 py-2 text-center">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {visibleCategories.map((cat) => (
                    <tr key={cat}>
                      <td className="sticky left-0 z-10 bg-white px-3 py-1.5 whitespace-nowrap text-stone-700">
                        {CATEGORY_LABEL[cat]}
                      </td>
                      {columns.map((c) => (
                        <td key={c.label} className="px-1.5 py-1.5 text-center">
                          <FeeCell
                            value={cellValue(c.ids, cat)}
                            onCommit={(raw) => commitCell(c.ids, cat, raw)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-4 text-xs">
              <button
                onClick={() => setShowAllCategories((v) => !v)}
                className="text-stone-500 hover:text-stone-700 hover:underline"
              >
                {showAllCategories ? 'Show fewer categories' : 'Show resident / citizen categories'}
              </button>
              {seasons.length > 0 && (
                <button
                  onClick={() => setShowSeasons((v) => !v)}
                  className="text-stone-500 hover:text-stone-700 hover:underline"
                >
                  {showSeasons ? 'Hide seasonal columns' : 'Add seasonal pricing'}
                </button>
              )}
            </div>

            <p className="text-xs text-stone-400">
              The engine applies your default traveler category (set in Seasons &amp; Defaults) to
              every traveler for now. Per-traveler overrides land in a later release.
            </p>

            <div className="space-y-3 border-t border-stone-100 pt-5">
              <div>
                <h3 className="text-sm font-semibold text-stone-800">Other fees</h3>
                <p className="text-xs text-stone-500">
                  Per-vehicle add-ons charged on top of the per-person entry. The crater descent
                  fees, NCAA gate fees and the like. Leave empty for parks that don&apos;t have
                  them.
                </p>
              </div>

              {ancillaryFees.length > 0 && (
                <div className="overflow-hidden rounded-md border border-stone-200">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="w-56 px-3 py-2 text-left">Charge basis</th>
                        <th className="w-28 px-3 py-2 text-right">Rate</th>
                        <th className="w-10 px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {ancillaryFees.map((fee) => (
                        <tr key={fee.id}>
                          <td className="px-3 py-2">
                            <input
                              defaultValue={fee.name}
                              onBlur={(e) => {
                                if (e.target.value.trim() && e.target.value !== fee.name) {
                                  updateAncillary.mutate({ id: fee.id, name: e.target.value });
                                }
                              }}
                              className="h-9 w-full rounded-md border border-stone-200 bg-white px-3 text-sm focus:border-emerald-400 focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={fee.chargeBasis}
                              onChange={(e) =>
                                updateAncillary.mutate({
                                  id: fee.id,
                                  chargeBasis: e.target.value as AncillaryBasis,
                                })
                              }
                              className="h-9 w-full rounded-md border border-stone-200 bg-white px-2 text-sm focus:border-emerald-400 focus:outline-none"
                            >
                              {ANCILLARY_BASES.map((b) => (
                                <option key={b} value={b}>
                                  {ANCILLARY_BASIS_LABEL[b]}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <div className="relative">
                              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-stone-400">
                                $
                              </span>
                              <input
                                key={fee.rate}
                                type="number"
                                min={0}
                                defaultValue={Number(fee.rate)}
                                onBlur={(e) => {
                                  const next = Number(e.target.value) || 0;
                                  if (next !== Number(fee.rate)) {
                                    updateAncillary.mutate({ id: fee.id, rate: next });
                                  }
                                }}
                                className="h-9 w-full rounded-md border border-stone-200 bg-white pl-5 pr-2 text-right text-sm tabular-nums focus:border-emerald-400 focus:outline-none"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeAncillary.mutate({ id: fee.id })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => addAncillary('per_vehicle_per_day')}
                  disabled={createAncillary.isPending}
                  className="flex items-center gap-1 rounded-md border border-dashed border-stone-300 px-3 py-1.5 text-xs text-stone-600 hover:border-stone-400 hover:bg-stone-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Per-vehicle, per-day fee
                </button>
                <button
                  onClick={() => addAncillary('per_vehicle_once_per_visit')}
                  disabled={createAncillary.isPending}
                  className="flex items-center gap-1 rounded-md border border-dashed border-stone-300 px-3 py-1.5 text-xs text-stone-600 hover:border-stone-400 hover:bg-stone-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  One-time visit fee
                </button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FeeCell({
  value,
  onCommit,
}: {
  value: number | undefined;
  onCommit: (raw: string) => void;
}) {
  return (
    <div className="relative mx-auto w-24">
      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-stone-400">
        $
      </span>
      <input
        key={value ?? 'empty'}
        type="number"
        min={0}
        defaultValue={value ?? ''}
        placeholder="—"
        onBlur={(e) => {
          const raw = e.target.value;
          const current = value ?? '';
          if (String(raw) !== String(current)) onCommit(raw);
        }}
        className="h-9 w-full rounded-md border border-stone-200 bg-white pl-5 pr-2 text-right text-sm tabular-nums placeholder:text-stone-300 focus:border-emerald-400 focus:outline-none"
      />
    </div>
  );
}
