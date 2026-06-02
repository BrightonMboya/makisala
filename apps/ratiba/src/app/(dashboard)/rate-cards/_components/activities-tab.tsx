'use client';

import { useMemo, useRef, useState } from 'react';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { toast } from '@repo/ui/toast';
import { Loader2, MapPin, Plus, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { CreatableAsyncCombobox } from '@/components/itinerary-builder/creatable-async-combobox';
import { searchPlaces } from '@/lib/geocoding';

const CHARGE_BASES = ['per_person', 'per_group'] as const;
type ChargeBasis = (typeof CHARGE_BASES)[number];

const CHARGE_BASIS_LABEL: Record<ChargeBasis, string> = {
  per_person: 'Per person',
  per_group: 'Per group',
};

const cellKey = (seasonId: string | null) => seasonId ?? 'null';

interface ActiveActivity {
  id: string;
  name: string;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
}

export function ActivitiesTab() {
  const utils = trpc.useUtils();
  const [selected, setSelected] = useState<ActiveActivity | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showSeasons, setShowSeasons] = useState(false);

  const { data: seasons = [] } = trpc.rateCards.seasons.list.useQuery();
  const { data: allRates = [] } = trpc.rateCards.activityRates.listAll.useQuery();

  const searchCacheRef = useRef<Map<string, ActiveActivity>>(new Map());

  const activitiesWithRates = useMemo(() => {
    const map = new Map<string, ActiveActivity>();
    for (const r of allRates) {
      if (r.activityId && !map.has(r.activityId)) {
        map.set(r.activityId, {
          id: r.activityId,
          name: r.activityName ?? 'Unnamed activity',
          locationName: r.activityLocationName ?? null,
          latitude: r.activityLatitude != null ? Number(r.activityLatitude) : null,
          longitude: r.activityLongitude != null ? Number(r.activityLongitude) : null,
        });
      }
    }
    return [...map.values()];
  }, [allRates]);

  const active = selected ?? activitiesWithRates[0] ?? null;

  const pills = useMemo(() => {
    const list = [...activitiesWithRates];
    if (selected && !list.some((p) => p.id === selected.id)) list.unshift(selected);
    return list;
  }, [activitiesWithRates, selected]);

  const { data: rates = [], isLoading: ratesLoading } =
    trpc.rateCards.activityRates.listByActivity.useQuery(
      { activityId: active?.id ?? '' },
      { enabled: !!active },
    );

  const invalidate = () => {
    if (active) utils.rateCards.activityRates.listByActivity.invalidate({ activityId: active.id });
    utils.rateCards.activityRates.listAll.invalidate();
  };

  const create = trpc.rateCards.activityRates.create.useMutation({
    onSuccess: () => {
      invalidate();
      toast({ title: 'Activity rate saved' });
    },
  });
  const update = trpc.rateCards.activityRates.update.useMutation({
    onSuccess: () => {
      invalidate();
      toast({ title: 'Activity rate updated' });
    },
  });
  const remove = trpc.rateCards.activityRates.delete.useMutation({
    onSuccess: () => {
      invalidate();
      toast({ title: 'Activity rate removed' });
    },
  });
  const updateLibrary = trpc.activities.update.useMutation({
    onSuccess: () => {
      utils.rateCards.activityRates.listAll.invalidate();
      toast({ title: 'Activity location saved' });
    },
  });
  const createActivity = trpc.activities.create.useMutation({
    onSuccess: () => toast({ title: 'Activity added' }),
  });

  const rateMap = useMemo(() => {
    const m = new Map<string, { id: string; rate: number; chargeBasis: ChargeBasis }>();
    for (const r of rates) {
      m.set(cellKey(r.seasonId), {
        id: r.id,
        rate: Number(r.rate),
        chargeBasis: r.chargeBasis as ChargeBasis,
      });
    }
    return m;
  }, [rates]);

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

  const currentBasis: ChargeBasis = useMemo(() => {
    const first = rates[0];
    return (first?.chargeBasis as ChargeBasis | undefined) ?? 'per_person';
  }, [rates]);

  const cellValue = (ids: (string | null)[]) => {
    for (const id of ids) {
      const r = rateMap.get(cellKey(id));
      if (r) return r.rate;
    }
    return undefined;
  };

  const selectActivity = (a: ActiveActivity) => {
    setSelected(a);
    setShowAdd(false);
  };

  const commitCell = (ids: (string | null)[], raw: string) => {
    if (!active) return;
    const value = Number(raw);
    const isEmpty = raw.trim() === '' || !value || value <= 0;
    for (const seasonId of ids) {
      const existing = rateMap.get(cellKey(seasonId));
      if (isEmpty) {
        if (existing) remove.mutate({ id: existing.id });
      } else if (existing) {
        if (value !== existing.rate) update.mutate({ id: existing.id, rate: value });
      } else {
        create.mutate({
          activityId: active.id,
          seasonId,
          rate: value,
          chargeBasis: currentBasis,
        });
      }
    }
  };

  const setBasisForActive = (basis: ChargeBasis) => {
    for (const r of rates) {
      if ((r.chargeBasis as ChargeBasis) !== basis) {
        update.mutate({ id: r.id, chargeBasis: basis });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity pricing</CardTitle>
        <CardDescription>
          Per-person (or per-group) cost of an activity. The auto-pricing engine adds these to a
          day&apos;s cost when you drop the activity onto the day-by-day builder. Optional
          activities are skipped.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Activity selector */}
        <div className="flex flex-wrap items-center gap-2">
          {pills.map((p) => (
            <button
              key={p.id}
              onClick={() => selectActivity(p)}
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

          {showAdd ? (
            <div className="flex items-center gap-1">
              <div className="w-72">
                <CreatableAsyncCombobox
                  value={null}
                  onChange={(id) => {
                    if (!id) return;
                    const cached = searchCacheRef.current.get(id);
                    if (cached) {
                      selectActivity(cached);
                    } else {
                      utils.activities.getById.fetch({ id }).then((a) => {
                        if (!a) return;
                        const next: ActiveActivity = {
                          id: a.id,
                          name: a.name,
                          locationName: a.locationName,
                          latitude: a.latitude != null ? Number(a.latitude) : null,
                          longitude: a.longitude != null ? Number(a.longitude) : null,
                        };
                        searchCacheRef.current.set(a.id, next);
                        selectActivity(next);
                      });
                    }
                  }}
                  onSearch={async (q) => {
                    const res = await utils.activities.search.fetch({ query: q, limit: 10 });
                    res.forEach((a) =>
                      searchCacheRef.current.set(a.id, {
                        id: a.id,
                        name: a.name,
                        locationName: null,
                        latitude: null,
                        longitude: null,
                      }),
                    );
                    return res.map((a) => ({ value: a.id, label: a.name }));
                  }}
                  onCreate={async (name) => {
                    const a = await createActivity.mutateAsync({ name });
                    const next: ActiveActivity = {
                      id: a.id,
                      name: a.name,
                      locationName: null,
                      latitude: null,
                      longitude: null,
                    };
                    searchCacheRef.current.set(a.id, next);
                    selectActivity(next);
                    return { value: a.id, label: a.name };
                  }}
                  placeholder="Search or create activity"
                  createLabel="Create"
                  className="w-full"
                />
              </div>
              <button
                onClick={() => setShowAdd(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1 rounded-full border border-dashed border-stone-300 px-3 py-1.5 text-sm text-stone-500 hover:border-stone-400 hover:bg-stone-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add activity
            </button>
          )}
        </div>

        {!active && (
          <div className="rounded-md border border-dashed border-stone-200 px-4 py-10 text-center">
            <p className="text-sm text-stone-500">
              Add an activity to start recording its pricing.
            </p>
          </div>
        )}

        {active && (
          <ActivityLocationEditor
            activity={active}
            onSave={async (patch) => {
              const row = await updateLibrary.mutateAsync({ id: active.id, ...patch });
              const next: ActiveActivity = {
                id: row.id,
                name: row.name,
                locationName: row.locationName,
                latitude: row.latitude != null ? Number(row.latitude) : null,
                longitude: row.longitude != null ? Number(row.longitude) : null,
              };
              searchCacheRef.current.set(row.id, next);
              setSelected(next);
              utils.rateCards.activityRates.listAll.invalidate();
              if (row.id !== active.id) {
                utils.rateCards.activityRates.listByActivity.invalidate({
                  activityId: row.id,
                });
              }
            }}
          />
        )}

        {active && ratesLoading && (
          <div className="flex items-center justify-center gap-2 rounded-md border border-stone-200 py-12 text-sm text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading rates…
          </div>
        )}

        {active && !ratesLoading && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span className="font-medium uppercase tracking-wide">Charge basis:</span>
              <select
                value={currentBasis}
                onChange={(e) => setBasisForActive(e.target.value as ChargeBasis)}
                className="h-8 rounded-md border border-stone-200 bg-white px-2 text-xs"
              >
                {CHARGE_BASES.map((b) => (
                  <option key={b} value={b}>
                    {CHARGE_BASIS_LABEL[b]}
                  </option>
                ))}
              </select>
              <span className="text-stone-400">
                {currentBasis === 'per_person'
                  ? '— multiplied by traveler count'
                  : '— charged once per day, regardless of pax'}
              </span>
            </div>

            <div className="overflow-x-auto rounded-md border border-stone-200">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="sticky left-0 z-10 bg-stone-50 px-3 py-2 text-left">
                      {CHARGE_BASIS_LABEL[currentBasis]} rate
                    </th>
                    {columns.map((c) => (
                      <th key={c.label} className="px-3 py-2 text-center">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr>
                    <td className="sticky left-0 z-10 bg-white px-3 py-1.5 whitespace-nowrap text-stone-700">
                      {active.name}
                    </td>
                    {columns.map((c) => (
                      <td key={c.label} className="px-1.5 py-1.5 text-center">
                        <RateCell
                          value={cellValue(c.ids)}
                          onCommit={(raw) => commitCell(c.ids, raw)}
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {seasons.length > 0 && (
              <div className="flex flex-wrap gap-4 text-xs">
                <button
                  onClick={() => setShowSeasons((v) => !v)}
                  className="text-stone-500 hover:text-stone-700 hover:underline"
                >
                  {showSeasons ? 'Hide seasonal columns' : 'Add seasonal pricing'}
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityLocationEditor({
  activity,
  onSave,
}: {
  activity: ActiveActivity;
  onSave: (patch: {
    locationName: string | null;
    latitude: number | null;
    longitude: number | null;
  }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleLocationSearch = async (query: string) => {
    if (query.length < 2) return [];
    const results = await searchPlaces(query);
    return results.map((r) => ({
      value: `${r.name}|${r.latitude}|${r.longitude}`,
      label: r.displayName,
    }));
  };

  const handleChoose = async (value: string | null) => {
    if (!value) {
      setSaving(true);
      try {
        await onSave({ locationName: null, latitude: null, longitude: null });
      } finally {
        setSaving(false);
        setEditing(false);
      }
      return;
    }
    const [name, latStr, lngStr] = value.split('|');
    if (!name) return;
    const lat = latStr ? Number(latStr) : NaN;
    const lng = lngStr ? Number(lngStr) : NaN;
    setSaving(true);
    try {
      await onSave({
        locationName: name,
        latitude: Number.isFinite(lat) ? lat : null,
        longitude: Number.isFinite(lng) ? lng : null,
      });
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs">
      <MapPin className="h-3.5 w-3.5 text-stone-400" />
      <span className="font-medium text-stone-500">Location</span>
      {editing ? (
        <div className="flex flex-1 items-center gap-2">
          <div className="min-w-0 flex-1">
            <CreatableAsyncCombobox
              value={null}
              onChange={handleChoose}
              onSearch={handleLocationSearch}
              placeholder="Search a place…"
              createLabel="Use"
              className="h-8 w-full"
            />
          </div>
          {activity.locationName && (
            <button
              onClick={() => handleChoose(null)}
              disabled={saving}
              className="text-stone-500 hover:text-stone-700 hover:underline"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setEditing(false)}
            className="text-stone-400 hover:text-stone-600"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className={activity.locationName ? 'text-stone-700' : 'text-stone-400'}>
            {activity.locationName ?? 'Not set'}
            {activity.latitude != null && activity.longitude != null && (
              <span className="ml-2 text-stone-400">
                ({activity.latitude.toFixed(4)}, {activity.longitude.toFixed(4)})
              </span>
            )}
          </span>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setEditing(true)}>
            Edit
          </Button>
        </div>
      )}
    </div>
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
