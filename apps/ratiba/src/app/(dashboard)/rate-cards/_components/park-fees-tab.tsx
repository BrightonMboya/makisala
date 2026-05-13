'use client';

import { useMemo, useState } from 'react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Combobox } from '@repo/ui/combobox';
import { toast } from '@repo/ui/toast';
import { Plus, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

const CATEGORIES = [
  'non_resident_adult',
  'non_resident_child',
  'east_african_resident_adult',
  'east_african_resident_child',
  'citizen_adult',
  'citizen_child',
] as const;

const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  non_resident_adult: 'Non-resident adult',
  non_resident_child: 'Non-resident child',
  east_african_resident_adult: 'EA resident adult',
  east_african_resident_child: 'EA resident child',
  citizen_adult: 'Citizen adult',
  citizen_child: 'Citizen child',
};

type Category = (typeof CATEGORIES)[number];

export function ParkFeesTab() {
  const utils = trpc.useUtils();
  const { data: parksData = [] } = trpc.nationalParks.getAll.useQuery();
  const { data: seasons = [] } = trpc.rateCards.seasons.list.useQuery();
  const [parkId, setParkId] = useState<string | null>(null);

  const parks = useMemo(
    () => parksData as { id: string; name: string }[],
    [parksData],
  );

  const parkOptions = useMemo(
    () => parks.map((p) => ({ value: p.id, label: p.name })),
    [parks],
  );

  const { data: rates = [] } = trpc.rateCards.parkFeeRates.listByPark.useQuery(
    { parkId: parkId! },
    { enabled: !!parkId },
  );

  const create = trpc.rateCards.parkFeeRates.create.useMutation({
    onSuccess: () =>
      utils.rateCards.parkFeeRates.listByPark.invalidate({ parkId: parkId! }),
  });
  const update = trpc.rateCards.parkFeeRates.update.useMutation({
    onSuccess: () =>
      utils.rateCards.parkFeeRates.listByPark.invalidate({ parkId: parkId! }),
  });
  const remove = trpc.rateCards.parkFeeRates.delete.useMutation({
    onSuccess: () =>
      utils.rateCards.parkFeeRates.listByPark.invalidate({ parkId: parkId! }),
  });

  const [draft, setDraft] = useState<{
    seasonId: string;
    category: Category;
    perPersonRate: number;
  }>({
    seasonId: '',
    category: 'non_resident_adult',
    perPersonRate: 0,
  });

  const handleAdd = async () => {
    if (!parkId) {
      toast({ title: 'Pick a park first', variant: 'destructive' });
      return;
    }
    await create.mutateAsync({
      parkId,
      seasonId: draft.seasonId || null,
      category: draft.category,
      perPersonRate: draft.perPersonRate,
    });
    setDraft({ ...draft, perPersonRate: 0 });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Park entry fees</CardTitle>
        <CardDescription>
          Leave season empty for a flat year-round fee. Season-specific rows override the
          year-round rate.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-md">
          <Combobox
            items={parkOptions}
            value={parkId ?? ''}
            onChange={(v) => setParkId(v || null)}
            placeholder="Select a park"
            className="w-full"
          />
        </div>

        {!parkId && <p className="text-sm text-stone-500">Pick a park to view or add fees.</p>}

        {parkId && (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 border-b border-stone-200 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
              <div className="col-span-4">Category</div>
              <div className="col-span-3">Season</div>
              <div className="col-span-3">Per person</div>
              <div className="col-span-1">Ccy</div>
              <div className="col-span-1" />
            </div>
            {rates.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-12 items-center gap-2 rounded-md border border-stone-100 bg-stone-50 px-2 py-1"
              >
                <select
                  className="col-span-4 h-9 rounded-md border border-stone-200 bg-white px-2 text-sm"
                  value={r.category}
                  onChange={(e) =>
                    update.mutate({ id: r.id, category: e.target.value as Category })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
                <select
                  className="col-span-3 h-9 rounded-md border border-stone-200 bg-white px-2 text-sm"
                  value={r.seasonId ?? ''}
                  onChange={(e) =>
                    update.mutate({ id: r.id, seasonId: e.target.value || null })
                  }
                >
                  <option value="">Year-round</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  className="col-span-3"
                  defaultValue={Number(r.perPersonRate)}
                  onBlur={(e) =>
                    Number(e.target.value) !== Number(r.perPersonRate) &&
                    update.mutate({ id: r.id, perPersonRate: Number(e.target.value) || 0 })
                  }
                />
                <Input
                  className="col-span-1"
                  defaultValue={r.currency}
                  onBlur={(e) =>
                    e.target.value !== r.currency &&
                    update.mutate({ id: r.id, currency: e.target.value.toUpperCase() })
                  }
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="col-span-1"
                  onClick={() => remove.mutate({ id: r.id })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div className="grid grid-cols-12 items-center gap-2 border-t border-dashed border-stone-200 pt-3">
              <select
                className="col-span-4 h-9 rounded-md border border-stone-200 bg-white px-2 text-sm"
                value={draft.category}
                onChange={(e) =>
                  setDraft({ ...draft, category: e.target.value as Category })
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
              <select
                className="col-span-3 h-9 rounded-md border border-stone-200 bg-white px-2 text-sm"
                value={draft.seasonId}
                onChange={(e) => setDraft({ ...draft, seasonId: e.target.value })}
              >
                <option value="">Year-round</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                className="col-span-3"
                value={draft.perPersonRate}
                onChange={(e) =>
                  setDraft({ ...draft, perPersonRate: Number(e.target.value) || 0 })
                }
              />
              <div className="col-span-1 text-center text-xs text-stone-500">USD</div>
              <Button
                size="icon"
                variant="outline"
                className="col-span-1"
                onClick={handleAdd}
                disabled={create.isPending}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
