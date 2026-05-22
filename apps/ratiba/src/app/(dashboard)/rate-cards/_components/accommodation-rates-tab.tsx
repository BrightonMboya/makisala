'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { toast } from '@repo/ui/toast';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { AsyncCombobox } from '@/components/itinerary-builder/async-combobox';

const ROOM_TYPES = ['single', 'double', 'triple', 'quad', 'family'] as const;
const MEAL_PLANS = ['ro', 'bb', 'hb', 'fb'] as const;
const RATE_BASES = ['per_person', 'per_room'] as const;

type RoomType = (typeof ROOM_TYPES)[number];
type MealPlan = (typeof MEAL_PLANS)[number];
type RateBasis = (typeof RATE_BASES)[number];

const BASIS_LABEL: Record<RateBasis, string> = {
  per_person: 'Per person',
  per_room: 'Per room',
};

type RoomConfig = { basis: RateBasis; maxOccupancy: number | null };

const ROOM_LABEL: Record<RoomType, string> = {
  single: 'Single',
  double: 'Double',
  triple: 'Triple',
  quad: 'Quad',
  family: 'Family',
};

const MEAL_LABEL: Record<MealPlan, string> = {
  ro: 'RO',
  bb: 'BB',
  hb: 'HB',
  fb: 'FB',
};

const MEAL_FULL: Record<MealPlan, string> = {
  ro: 'Room only',
  bb: 'Bed & breakfast',
  hb: 'Half board',
  fb: 'Full board',
};

const rowKey = (rt: RoomType, mp: MealPlan) => `${rt}|${mp}`;
const cellKey = (seasonId: string, rt: RoomType, mp: MealPlan) => `${seasonId}|${rt}|${mp}`;

export function AccommodationRatesTab() {
  const utils = trpc.useUtils();
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [showAddHotel, setShowAddHotel] = useState(false);

  const { data: seasons = [] } = trpc.rateCards.seasons.list.useQuery();
  const { data: allRates = [] } = trpc.rateCards.accommodationRates.listAll.useQuery();
  const [extraRows, setExtraRows] = useState<string[]>([]);
  const [newRoom, setNewRoom] = useState<RoomType>('double');
  const [newMeal, setNewMeal] = useState<MealPlan>('fb');

  // Caches id -> name for hotels surfaced in search, so onChange can resolve a
  // name without re-fetching.
  const searchCacheRef = useRef<Map<string, string>>(new Map());

  // Hotels that already have at least one rate, derived from listAll.
  const hotelsWithRates = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of allRates) {
      if (r.accommodationId && !map.has(r.accommodationId)) {
        map.set(r.accommodationId, r.accommodationName ?? 'Unnamed hotel');
      }
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [allRates]);

  // Default-select the first hotel once data is in.
  useEffect(() => {
    if (!selected && hotelsWithRates.length > 0) {
      setSelected(hotelsWithRates[0]!);
    }
  }, [hotelsWithRates, selected]);

  const pills = useMemo(() => {
    const list = [...hotelsWithRates];
    if (selected && !list.some((h) => h.id === selected.id)) list.unshift(selected);
    return list;
  }, [hotelsWithRates, selected]);

  const { data: rates = [], isLoading: ratesLoading } =
    trpc.rateCards.accommodationRates.listByAccommodation.useQuery(
      { accommodationId: selected?.id ?? '' },
      { enabled: !!selected },
    );

  const invalidate = () => {
    if (selected) {
      utils.rateCards.accommodationRates.listByAccommodation.invalidate({
        accommodationId: selected.id,
      });
    }
    utils.rateCards.accommodationRates.listAll.invalidate();
  };

  const create = trpc.rateCards.accommodationRates.create.useMutation({ onSuccess: invalidate });
  const update = trpc.rateCards.accommodationRates.update.useMutation({ onSuccess: invalidate });
  const remove = trpc.rateCards.accommodationRates.delete.useMutation({ onSuccess: invalidate });
  const setBasis = trpc.rateCards.accommodationRates.setRoomTypeBasis.useMutation({
    onSuccess: invalidate,
  });

  // Pricing basis + capacity are per (hotel, room type). The server value lives
  // on the rate rows; local edits override until the refetch catches up.
  const [roomConfig, setRoomConfig] = useState<Partial<Record<RoomType, RoomConfig>>>({});

  const serverConfig = useMemo(() => {
    const m = new Map<RoomType, RoomConfig>();
    for (const r of rates) {
      const rt = r.roomType as RoomType;
      if (!m.has(rt)) {
        m.set(rt, {
          basis: ((r as { rateBasis?: RateBasis }).rateBasis ?? 'per_person') as RateBasis,
          maxOccupancy: (r as { maxOccupancy?: number | null }).maxOccupancy ?? null,
        });
      }
    }
    return m;
  }, [rates]);

  const cfgFor = (rt: RoomType): RoomConfig =>
    roomConfig[rt] ?? serverConfig.get(rt) ?? { basis: 'per_person', maxOccupancy: null };
  const rtHasRows = (rt: RoomType) => rates.some((r) => (r.roomType as RoomType) === rt);

  const changeBasis = (rt: RoomType, basis: RateBasis) => {
    const maxOccupancy = basis === 'per_room' ? cfgFor(rt).maxOccupancy : null;
    setRoomConfig((p) => ({ ...p, [rt]: { basis, maxOccupancy } }));
    if (selected && rtHasRows(rt)) {
      setBasis.mutate({ accommodationId: selected.id, roomType: rt, rateBasis: basis, maxOccupancy });
    }
  };

  const changeCapacity = (rt: RoomType, maxOccupancy: number | null) => {
    setRoomConfig((p) => ({ ...p, [rt]: { basis: 'per_room', maxOccupancy } }));
    if (selected && rtHasRows(rt)) {
      setBasis.mutate({
        accommodationId: selected.id,
        roomType: rt,
        rateBasis: 'per_room',
        maxOccupancy,
      });
    }
  };

  // Map of cell -> existing rate row.
  const rateMap = useMemo(() => {
    const m = new Map<string, { id: string; perPaxRate: number }>();
    for (const r of rates) {
      m.set(cellKey(r.seasonId, r.roomType as RoomType, r.mealPlan as MealPlan), {
        id: r.id,
        perPaxRate: Number(r.perPaxRate),
      });
    }
    return m;
  }, [rates]);

  // One column per distinct season NAME. A name can cover several date bands
  // (e.g. "High" = Jun-Oct and Dec-Jan), so each column maps to all its band ids
  // and a price written to the column applies to every band.
  const seasonGroups = useMemo(() => {
    const order: string[] = [];
    const byName = new Map<string, string[]>();
    for (const s of seasons) {
      if (!byName.has(s.name)) {
        byName.set(s.name, []);
        order.push(s.name);
      }
      byName.get(s.name)!.push(s.id);
    }
    return order.map((name) => ({ name, ids: byName.get(name)! }));
  }, [seasons]);

  const cellValue = (ids: string[], rt: RoomType, mp: MealPlan) => {
    for (const id of ids) {
      const r = rateMap.get(cellKey(id, rt, mp));
      if (r) return r.perPaxRate;
    }
    return undefined;
  };

  // Rows = distinct room/meal in rates + locally-added empty rows.
  const rows = useMemo(() => {
    const set = new Set<string>(extraRows);
    for (const r of rates) set.add(rowKey(r.roomType as RoomType, r.mealPlan as MealPlan));
    return [...set]
      .map((k) => {
        const [rt, mp] = k.split('|') as [RoomType, MealPlan];
        return { rt, mp, key: k };
      })
      .sort((a, b) => {
        const ra = ROOM_TYPES.indexOf(a.rt) - ROOM_TYPES.indexOf(b.rt);
        return ra !== 0 ? ra : MEAL_PLANS.indexOf(a.mp) - MEAL_PLANS.indexOf(b.mp);
      });
  }, [rates, extraRows]);

  const selectHotel = (id: string, name: string) => {
    setSelected({ id, name });
    setExtraRows([]);
    setRoomConfig({});
    setShowAddHotel(false);
  };

  // Distinct room types currently in the sheet, for the pricing-basis panel.
  const roomTypesInSheet = useMemo(() => {
    const set = new Set<RoomType>();
    for (const r of rows) set.add(r.rt);
    return [...set].sort((a, b) => ROOM_TYPES.indexOf(a) - ROOM_TYPES.indexOf(b));
  }, [rows]);

  const commitCell = (ids: string[], rt: RoomType, mp: MealPlan, raw: string) => {
    if (!selected) return;
    const value = Number(raw);
    const isEmpty = raw.trim() === '' || !value || value <= 0;

    // Fan the value out to every date band that shares this season name.
    for (const seasonId of ids) {
      const existing = rateMap.get(cellKey(seasonId, rt, mp));
      if (isEmpty) {
        if (existing) remove.mutate({ id: existing.id });
      } else if (existing) {
        if (value !== existing.perPaxRate) update.mutate({ id: existing.id, perPaxRate: value });
      } else {
        const cfg = cfgFor(rt);
        create.mutate({
          accommodationId: selected.id,
          seasonId,
          roomType: rt,
          mealPlan: mp,
          perPaxRate: value,
          rateBasis: cfg.basis,
          maxOccupancy: cfg.maxOccupancy,
        });
      }
    }
  };

  const addRow = () => {
    const k = rowKey(newRoom, newMeal);
    if (rows.some((r) => r.key === k)) {
      toast({ title: 'That room + meal row already exists' });
      return;
    }
    setExtraRows((prev) => [...prev, k]);
  };

  const removeRow = (rt: RoomType, mp: MealPlan) => {
    for (const s of seasons) {
      const existing = rateMap.get(cellKey(s.id, rt, mp));
      if (existing) remove.mutate({ id: existing.id });
    }
    setExtraRows((prev) => prev.filter((k) => k !== rowKey(rt, mp)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hotels &amp; Camps</CardTitle>
        <CardDescription>
          Pick a hotel, then fill its STO sheet: room &amp; meal plan down the side, seasons across
          the top. Rates are per person sharing by default; switch a room type to per room below
          if a hotel charges a flat room price. Leave a cell blank if you don&apos;t sell it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Hotel selector */}
        <div className="flex flex-wrap items-center gap-2">
          {pills.map((h) => (
            <button
              key={h.id}
              onClick={() => selectHotel(h.id, h.name)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                selected?.id === h.id
                  ? 'border-emerald-300 bg-emerald-50 font-medium text-emerald-900'
                  : 'border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50',
              )}
            >
              {h.name}
            </button>
          ))}

          {showAddHotel ? (
            <div className="flex items-center gap-1">
              <div className="w-64">
                <AsyncCombobox
                  value={null}
                  onChange={(id) => {
                    if (!id) return;
                    const name = searchCacheRef.current.get(id);
                    if (name) {
                      selectHotel(id, name);
                    } else {
                      utils.accommodations.getLookup
                        .fetch({ id })
                        .then((a) => a && selectHotel(a.id, a.name));
                    }
                  }}
                  onSearch={async (q) => {
                    const res = await utils.accommodations.search.fetch({ query: q, limit: 10 });
                    res.forEach((a) => searchCacheRef.current.set(a.id, a.name));
                    return res.map((a) => ({ value: a.id, label: a.name }));
                  }}
                  placeholder="Search hotels"
                  className="w-full"
                />
              </div>
              <button
                onClick={() => setShowAddHotel(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddHotel(true)}
              className="flex items-center gap-1 rounded-full border border-dashed border-stone-300 px-3 py-1.5 text-sm text-stone-500 hover:border-stone-400 hover:bg-stone-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add hotel
            </button>
          )}
        </div>

        {!selected && (
          <div className="rounded-md border border-dashed border-stone-200 px-4 py-10 text-center">
            <p className="text-sm text-stone-500">
              Add a hotel to start recording its rates.
            </p>
          </div>
        )}

        {selected && seasons.length === 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Define your seasons first (Seasons &amp; Defaults). Hotel rates are stored per season.
          </div>
        )}

        {selected && seasons.length > 0 && ratesLoading && (
          <div className="flex items-center justify-center gap-2 rounded-md border border-stone-200 py-12 text-sm text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading rates…
          </div>
        )}

        {selected && seasons.length > 0 && !ratesLoading && (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-md border border-stone-200">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="sticky left-0 z-10 bg-stone-50 px-3 py-2 text-left">
                      Room / Meal
                    </th>
                    {seasonGroups.map((g) => (
                      <th key={g.name} className="px-3 py-2 text-center">
                        {g.name}
                      </th>
                    ))}
                    <th className="w-10 px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {rows.map((row) => (
                    <tr key={row.key}>
                      <td className="sticky left-0 z-10 bg-white px-3 py-1.5 whitespace-nowrap text-stone-700">
                        {ROOM_LABEL[row.rt]}{' '}
                        <span className="text-stone-400">·</span>{' '}
                        <span title={MEAL_FULL[row.mp]}>{MEAL_LABEL[row.mp]}</span>
                      </td>
                      {seasonGroups.map((g) => (
                        <td key={g.name} className="px-1.5 py-1.5 text-center">
                          <RateCell
                            value={cellValue(g.ids, row.rt, row.mp)}
                            onCommit={(raw) => commitCell(g.ids, row.rt, row.mp, raw)}
                          />
                        </td>
                      ))}
                      <td className="px-2 py-1.5 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeRow(row.rt, row.mp)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={seasonGroups.length + 2}
                        className="px-3 py-6 text-center text-sm text-stone-500"
                      >
                        No room types yet. Add one below to start filling the sheet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Per room-type pricing basis */}
            {roomTypesInSheet.length > 0 && (
              <div className="rounded-md border border-stone-200 p-3">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-stone-500">
                  Pricing basis (per room type)
                </p>
                <div className="space-y-2">
                  {roomTypesInSheet.map((rt) => {
                    const cfg = cfgFor(rt);
                    return (
                      <div key={rt} className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="w-14 text-stone-700">{ROOM_LABEL[rt]}</span>
                        <select
                          value={cfg.basis}
                          onChange={(e) => changeBasis(rt, e.target.value as RateBasis)}
                          className="h-8 rounded-md border border-stone-200 bg-white px-2 text-sm"
                        >
                          {RATE_BASES.map((b) => (
                            <option key={b} value={b}>
                              {BASIS_LABEL[b]}
                            </option>
                          ))}
                        </select>
                        {cfg.basis === 'per_room' && (
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs text-stone-500">max occupancy</label>
                            <input
                              type="number"
                              min={1}
                              value={cfg.maxOccupancy ?? ''}
                              onChange={(e) =>
                                changeCapacity(
                                  rt,
                                  e.target.value ? parseInt(e.target.value, 10) : null,
                                )
                              }
                              placeholder="—"
                              className={cn(
                                'h-8 w-16 rounded-md border bg-white px-2 text-center text-sm',
                                cfg.maxOccupancy
                                  ? 'border-stone-200'
                                  : 'border-amber-300 bg-amber-50',
                              )}
                            />
                          </div>
                        )}
                        <span className="text-xs text-stone-400">
                          {cfg.basis === 'per_person'
                            ? 'price is per traveler sharing'
                            : 'flat price for the whole room'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add room/meal row */}
            <div className="flex flex-wrap items-end gap-2 rounded-md border border-stone-200 bg-stone-50/50 p-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
                  Room type
                </label>
                <select
                  className="h-9 rounded-md border border-stone-200 bg-white px-2 text-sm"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value as RoomType)}
                >
                  {ROOM_TYPES.map((rt) => (
                    <option key={rt} value={rt}>
                      {ROOM_LABEL[rt]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
                  Meal plan
                </label>
                <select
                  className="h-9 rounded-md border border-stone-200 bg-white px-2 text-sm"
                  value={newMeal}
                  onChange={(e) => setNewMeal(e.target.value as MealPlan)}
                >
                  {MEAL_PLANS.map((mp) => (
                    <option key={mp} value={mp}>
                      {MEAL_LABEL[mp]} — {MEAL_FULL[mp]}
                    </option>
                  ))}
                </select>
              </div>
              <Button variant="outline" onClick={addRow} className="gap-1">
                <Plus className="h-4 w-4" />
                Add room / meal
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RateCell({
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
