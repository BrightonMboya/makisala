'use client';

import { useMemo, useRef, useState } from 'react';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { toast } from '@repo/ui/toast';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { AsyncCombobox } from '@/components/itinerary-builder/async-combobox';

const MEAL_PLANS = ['ro', 'bb', 'hb', 'fb'] as const;
const RATE_BASES = ['per_person', 'per_room'] as const;

const ROOM_PRESETS = ['single', 'double', 'triple', 'quad', 'family'] as const;

type MealPlan = (typeof MEAL_PLANS)[number];
type RateBasis = (typeof RATE_BASES)[number];

const BASIS_LABEL: Record<RateBasis, string> = {
  per_person: 'Per person',
  per_room: 'Per room',
};

type RoomConfig = { basis: RateBasis; maxOccupancy: number | null };

const labelFor = (rt: string) =>
  rt
    .split(/\s+/)
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : ''))
    .join(' ');

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

const rowKey = (rt: string, mp: MealPlan) => `${rt}|${mp}`;
const cellKey = (seasonId: string, rt: string, mp: MealPlan) => `${seasonId}|${rt}|${mp}`;

const presetIndex = (rt: string) => {
  const i = (ROOM_PRESETS as readonly string[]).indexOf(rt);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
};
const compareRooms = (a: string, b: string) => {
  const pa = presetIndex(a);
  const pb = presetIndex(b);
  if (pa !== pb) return pa - pb;
  return a.localeCompare(b);
};

export function AccommodationRatesTab() {
  const utils = trpc.useUtils();
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [showAddHotel, setShowAddHotel] = useState(false);

  const { data: seasons = [] } = trpc.rateCards.seasons.list.useQuery();
  const { data: allRates = [] } = trpc.rateCards.accommodationRates.listAll.useQuery();
  const [extraRows, setExtraRows] = useState<string[]>([]);
  const [newRoom, setNewRoom] = useState<string>('double');
  const [newMeal, setNewMeal] = useState<MealPlan>('fb');
  const [newBasis, setNewBasis] = useState<RateBasis>('per_person');
  const [newCapacity, setNewCapacity] = useState<string>('');

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

  const active = selected ?? hotelsWithRates[0] ?? null;

  const pills = useMemo(() => {
    const list = [...hotelsWithRates];
    if (selected && !list.some((h) => h.id === selected.id)) list.unshift(selected);
    return list;
  }, [hotelsWithRates, selected]);

  const { data: rates = [], isLoading: ratesLoading } =
    trpc.rateCards.accommodationRates.listByAccommodation.useQuery(
      { accommodationId: active?.id ?? '' },
      { enabled: !!active },
    );

  const invalidate = () => {
    if (active) {
      utils.rateCards.accommodationRates.listByAccommodation.invalidate({
        accommodationId: active.id,
      });
      utils.rateCards.accommodationRates.roomTypesForAccommodation.invalidate({
        accommodationId: active.id,
      });
    }
    utils.rateCards.accommodationRates.listAll.invalidate();
  };

  const create = trpc.rateCards.accommodationRates.create.useMutation({
    onSuccess: () => {
      invalidate();
      toast({ title: 'Rate saved' });
    },
  });
  const update = trpc.rateCards.accommodationRates.update.useMutation({
    onSuccess: () => {
      invalidate();
      toast({ title: 'Rate updated' });
    },
  });
  const remove = trpc.rateCards.accommodationRates.delete.useMutation({
    onSuccess: () => {
      invalidate();
      toast({ title: 'Rate removed' });
    },
  });
  const setBasis = trpc.rateCards.accommodationRates.setRoomTypeBasis.useMutation({
    onSuccess: () => {
      invalidate();
      toast({ title: 'Pricing basis updated' });
    },
  });

  // Pricing basis + capacity are per (hotel, room type). The server value lives
  // on the rate rows; local edits override until the refetch catches up.
  const [roomConfig, setRoomConfig] = useState<Record<string, RoomConfig>>({});

  const serverConfig = useMemo(() => {
    const m = new Map<string, RoomConfig>();
    for (const r of rates) {
      const rt = r.roomType;
      if (!m.has(rt)) {
        m.set(rt, {
          basis: ((r as { rateBasis?: RateBasis }).rateBasis ?? 'per_person') as RateBasis,
          maxOccupancy: (r as { maxOccupancy?: number | null }).maxOccupancy ?? null,
        });
      }
    }
    return m;
  }, [rates]);

  const cfgFor = (rt: string): RoomConfig =>
    roomConfig[rt] ?? serverConfig.get(rt) ?? { basis: 'per_person', maxOccupancy: null };
  const rtHasRows = (rt: string) => rates.some((r) => r.roomType === rt);

  const changeBasis = (rt: string, basis: RateBasis) => {
    const maxOccupancy = basis === 'per_room' ? cfgFor(rt).maxOccupancy : null;
    setRoomConfig((p) => ({ ...p, [rt]: { basis, maxOccupancy } }));
    if (active && rtHasRows(rt)) {
      setBasis.mutate({ accommodationId: active.id, roomType: rt, rateBasis: basis, maxOccupancy });
    }
  };

  const changeCapacity = (rt: string, maxOccupancy: number | null) => {
    setRoomConfig((p) => ({ ...p, [rt]: { basis: 'per_room', maxOccupancy } }));
    if (active && rtHasRows(rt)) {
      setBasis.mutate({
        accommodationId: active.id,
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
      m.set(cellKey(r.seasonId, r.roomType, r.mealPlan as MealPlan), {
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

  const cellValue = (ids: string[], rt: string, mp: MealPlan) => {
    for (const id of ids) {
      const r = rateMap.get(cellKey(id, rt, mp));
      if (r) return r.perPaxRate;
    }
    return undefined;
  };

  // Rows = distinct room/meal in rates + locally-added empty rows.
  const rows = useMemo(() => {
    const set = new Set<string>(extraRows);
    for (const r of rates) set.add(rowKey(r.roomType, r.mealPlan as MealPlan));
    return [...set]
      .map((k) => {
        const i = k.indexOf('|');
        const rt = k.slice(0, i);
        const mp = k.slice(i + 1) as MealPlan;
        return { rt, mp, key: k };
      })
      .sort((a, b) => {
        const ra = compareRooms(a.rt, b.rt);
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
    const set = new Set<string>();
    for (const r of rows) set.add(r.rt);
    return [...set].sort(compareRooms);
  }, [rows]);

  const commitCell = (ids: string[], rt: string, mp: MealPlan, raw: string) => {
    if (!active) return;
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
          accommodationId: active.id,
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
    const trimmed = newRoom.trim();
    if (!trimmed) {
      toast({ title: 'Give the room a name first' });
      return;
    }
    const capacity = newCapacity ? parseInt(newCapacity, 10) : null;
    if (newBasis === 'per_room' && (!capacity || capacity < 1)) {
      toast({ title: 'Per-room rooms need a max occupancy' });
      return;
    }
    const k = rowKey(trimmed, newMeal);
    if (rows.some((r) => r.key === k)) {
      toast({ title: 'That room + meal row already exists' });
      return;
    }
    setExtraRows((prev) => [...prev, k]);
    setRoomConfig((p) => ({
      ...p,
      [trimmed]: { basis: newBasis, maxOccupancy: newBasis === 'per_room' ? capacity : null },
    }));
    if (active && rtHasRows(trimmed)) {
      setBasis.mutate({
        accommodationId: active.id,
        roomType: trimmed,
        rateBasis: newBasis,
        maxOccupancy: newBasis === 'per_room' ? capacity : null,
      });
    }
    setNewRoom('');
    setNewCapacity('');
  };

  const removeRow = (rt: string, mp: MealPlan) => {
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
          the top. Rooms are free-form, so camps with named suites (e.g. &quot;Lagoon View&quot;,
          &quot;Savannah Panoramic&quot;) can record them alongside the generic single/double labels.
          Rates are per person sharing by default; switch a room type to per room below if a hotel
          charges a flat room price.
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
                active?.id === h.id
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

        {!active && (
          <div className="rounded-md border border-dashed border-stone-200 px-4 py-10 text-center">
            <p className="text-sm text-stone-500">
              Add a hotel to start recording its rates.
            </p>
          </div>
        )}

        {active && seasons.length === 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Define your seasons first (Seasons &amp; Defaults). Hotel rates are stored per season.
          </div>
        )}

        {active && seasons.length > 0 && ratesLoading && (
          <div className="flex items-center justify-center gap-2 rounded-md border border-stone-200 py-12 text-sm text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading rates…
          </div>
        )}

        {active && seasons.length > 0 && !ratesLoading && (
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
                        {labelFor(row.rt)}{' '}
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
                        <span className="min-w-[3.5rem] text-stone-700">{labelFor(rt)}</span>
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
            <div className="space-y-2 rounded-md border border-stone-200 bg-stone-50/50 p-3">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[12rem] flex-1">
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
                    Room name
                  </label>
                  <input
                    type="text"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addRow();
                      }
                    }}
                    placeholder="e.g. Double, Lagoon View, Savannah Panoramic"
                    className="h-9 w-full rounded-md border border-stone-200 bg-white px-2 text-sm"
                  />
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
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
                    Basis
                  </label>
                  <select
                    className="h-9 rounded-md border border-stone-200 bg-white px-2 text-sm"
                    value={newBasis}
                    onChange={(e) => setNewBasis(e.target.value as RateBasis)}
                  >
                    {RATE_BASES.map((b) => (
                      <option key={b} value={b}>
                        {BASIS_LABEL[b]}
                      </option>
                    ))}
                  </select>
                </div>
                {newBasis === 'per_room' && (
                  <div>
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
                      Max occupancy
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(e.target.value)}
                      placeholder="e.g. 2"
                      className={cn(
                        'h-9 w-24 rounded-md border bg-white px-2 text-sm',
                        newCapacity ? 'border-stone-200' : 'border-amber-300 bg-amber-50',
                      )}
                    />
                  </div>
                )}
                <Button variant="outline" onClick={addRow} className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add room / meal
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-stone-500">Quick add:</span>
                {ROOM_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewRoom(p)}
                    className="rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[11px] text-stone-600 hover:border-stone-300 hover:bg-stone-100"
                  >
                    {labelFor(p)}
                  </button>
                ))}
              </div>
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
