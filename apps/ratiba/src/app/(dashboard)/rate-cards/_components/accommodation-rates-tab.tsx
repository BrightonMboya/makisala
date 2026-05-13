'use client';

import { useMemo, useState } from 'react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Combobox } from '@repo/ui/combobox';
import { toast } from '@repo/ui/toast';
import { Plus, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

const ROOM_TYPES = ['single', 'double', 'triple', 'quad', 'family'] as const;
const MEAL_PLANS = ['ro', 'bb', 'hb', 'fb', 'ai'] as const;

type RoomType = (typeof ROOM_TYPES)[number];
type MealPlan = (typeof MEAL_PLANS)[number];

export function AccommodationRatesTab() {
  const utils = trpc.useUtils();
  const { data: accomData } = trpc.accommodations.list.useQuery({ limit: 100 });
  const { data: seasons = [] } = trpc.rateCards.seasons.list.useQuery();
  const [accommodationId, setAccommodationId] = useState<string | null>(null);

  const accommodations = useMemo(
    () => (accomData?.accommodations ?? []) as { id: string; name: string }[],
    [accomData],
  );

  const accommodationOptions = useMemo(
    () => accommodations.map((a) => ({ value: a.id, label: a.name })),
    [accommodations],
  );

  const { data: rates = [] } = trpc.rateCards.accommodationRates.listByAccommodation.useQuery(
    { accommodationId: accommodationId! },
    { enabled: !!accommodationId },
  );

  const create = trpc.rateCards.accommodationRates.create.useMutation({
    onSuccess: () =>
      utils.rateCards.accommodationRates.listByAccommodation.invalidate({
        accommodationId: accommodationId!,
      }),
  });
  const update = trpc.rateCards.accommodationRates.update.useMutation({
    onSuccess: () =>
      utils.rateCards.accommodationRates.listByAccommodation.invalidate({
        accommodationId: accommodationId!,
      }),
  });
  const remove = trpc.rateCards.accommodationRates.delete.useMutation({
    onSuccess: () =>
      utils.rateCards.accommodationRates.listByAccommodation.invalidate({
        accommodationId: accommodationId!,
      }),
  });

  const [draft, setDraft] = useState<{
    seasonId: string;
    roomType: RoomType;
    mealPlan: MealPlan;
    perPaxRate: number;
  }>({
    seasonId: '',
    roomType: 'double',
    mealPlan: 'hb',
    perPaxRate: 0,
  });

  const handleAdd = async () => {
    if (!accommodationId) {
      toast({ title: 'Pick a hotel first', variant: 'destructive' });
      return;
    }
    if (!draft.seasonId) {
      toast({ title: 'Pick a season', variant: 'destructive' });
      return;
    }
    await create.mutateAsync({ ...draft, accommodationId });
    setDraft({ ...draft, perPaxRate: 0 });
  };

  const seasonName = (id: string) => seasons.find((s) => s.id === id)?.name ?? '?';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hotel STO rates</CardTitle>
        <CardDescription>
          One row per (season, room type, meal plan). Per-pax-sharing rate.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-md">
          <Combobox
            items={accommodationOptions}
            value={accommodationId ?? ''}
            onChange={(val) => setAccommodationId(val || null)}
            placeholder="Select a hotel"
            className="w-full"
          />
        </div>

        {!accommodationId && (
          <p className="text-sm text-stone-500">Pick a hotel to view or add rates.</p>
        )}

        {accommodationId && seasons.length === 0 && (
          <p className="text-sm text-amber-700">
            No seasons defined yet. Add seasons on the Seasons tab first.
          </p>
        )}

        {accommodationId && seasons.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 border-b border-stone-200 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
              <div className="col-span-3">Season</div>
              <div className="col-span-3">Room type</div>
              <div className="col-span-2">Meal plan</div>
              <div className="col-span-2">Per pax</div>
              <div className="col-span-1">Ccy</div>
              <div className="col-span-1" />
            </div>
            {rates.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-12 items-center gap-2 rounded-md border border-stone-100 bg-stone-50 px-2 py-1"
              >
                <select
                  className="col-span-3 h-9 rounded-md border border-stone-200 bg-white px-2 text-sm"
                  value={r.seasonId}
                  onChange={(e) => update.mutate({ id: r.id, seasonId: e.target.value })}
                >
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select
                  className="col-span-3 h-9 rounded-md border border-stone-200 bg-white px-2 text-sm"
                  value={r.roomType}
                  onChange={(e) =>
                    update.mutate({ id: r.id, roomType: e.target.value as RoomType })
                  }
                >
                  {ROOM_TYPES.map((rt) => (
                    <option key={rt} value={rt}>
                      {rt}
                    </option>
                  ))}
                </select>
                <select
                  className="col-span-2 h-9 rounded-md border border-stone-200 bg-white px-2 text-sm"
                  value={r.mealPlan}
                  onChange={(e) =>
                    update.mutate({ id: r.id, mealPlan: e.target.value as MealPlan })
                  }
                >
                  {MEAL_PLANS.map((mp) => (
                    <option key={mp} value={mp}>
                      {mp.toUpperCase()}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  className="col-span-2"
                  defaultValue={Number(r.perPaxRate)}
                  onBlur={(e) =>
                    Number(e.target.value) !== Number(r.perPaxRate) &&
                    update.mutate({ id: r.id, perPaxRate: Number(e.target.value) || 0 })
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

            {/* New row */}
            <div className="grid grid-cols-12 items-center gap-2 border-t border-dashed border-stone-200 pt-3">
              <select
                className="col-span-3 h-9 rounded-md border border-stone-200 bg-white px-2 text-sm"
                value={draft.seasonId}
                onChange={(e) => setDraft({ ...draft, seasonId: e.target.value })}
              >
                <option value="">— pick season —</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                className="col-span-3 h-9 rounded-md border border-stone-200 bg-white px-2 text-sm"
                value={draft.roomType}
                onChange={(e) =>
                  setDraft({ ...draft, roomType: e.target.value as RoomType })
                }
              >
                {ROOM_TYPES.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
              <select
                className="col-span-2 h-9 rounded-md border border-stone-200 bg-white px-2 text-sm"
                value={draft.mealPlan}
                onChange={(e) =>
                  setDraft({ ...draft, mealPlan: e.target.value as MealPlan })
                }
              >
                {MEAL_PLANS.map((mp) => (
                  <option key={mp} value={mp}>
                    {mp.toUpperCase()}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                className="col-span-2"
                value={draft.perPaxRate}
                onChange={(e) =>
                  setDraft({ ...draft, perPaxRate: Number(e.target.value) || 0 })
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

            {/* Bonus: show season name lookup row for transparency */}
            {rates.length > 0 && (
              <p className="pt-2 text-xs text-stone-400">
                Seasons in use: {Array.from(new Set(rates.map((r) => seasonName(r.seasonId)))).join(', ')}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
