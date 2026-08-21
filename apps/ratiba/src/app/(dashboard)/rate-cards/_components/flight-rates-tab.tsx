'use client';

import { useState } from 'react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { toast } from '@repo/ui/toast';
import { Plus, Trash2, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function FlightRatesTab() {
  const utils = trpc.useUtils();
  const { data: seasons = [] } = trpc.rateCards.seasons.list.useQuery();
  const {
    data: rows = [],
    isLoading,
    isError,
    refetch,
  } = trpc.rateCards.flightRates.list.useQuery();
  const create = trpc.rateCards.flightRates.create.useMutation({
    onSuccess: () => {
      utils.rateCards.flightRates.list.invalidate();
      setIsAdding(false);
      toast({ title: 'Flight rate added' });
    },
  });
  const update = trpc.rateCards.flightRates.update.useMutation({
    onSuccess: () => {
      utils.rateCards.flightRates.list.invalidate();
      toast({ title: 'Flight rate updated' });
    },
  });
  const remove = trpc.rateCards.flightRates.delete.useMutation({
    onSuccess: () => {
      utils.rateCards.flightRates.list.invalidate();
      toast({ title: 'Flight rate removed' });
    },
  });

  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState<{ name: string; seasonId: string | null; perPersonRate: number }>({
    name: '',
    seasonId: null,
    perPersonRate: 0,
  });

  const handleAdd = async () => {
    if (!draft.name) {
      toast({ title: 'Route name required', variant: 'destructive' });
      return;
    }
    await create.mutateAsync(draft);
    setDraft({ name: '', seasonId: null, perPersonRate: 0 });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flights</CardTitle>
        <CardDescription>
          Domestic/charter legs (e.g. Arusha–Zanzibar), priced per person. Add one row per
          season if the fare changes — a route with no season row applies year-round.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isError && (
          <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>Couldn&apos;t load flight rates.</span>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {isLoading && rows.length === 0 && (
          <div className="space-y-2">
            <div className="h-10 animate-pulse rounded-md bg-stone-100" />
            <div className="h-10 animate-pulse rounded-md bg-stone-100" />
          </div>
        )}

        {rows.length > 0 && (
          <div className="overflow-hidden rounded-md border border-stone-200">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-3 py-2 text-left">Route</th>
                  <th className="w-44 px-3 py-2 text-left">Season</th>
                  <th className="w-32 px-3 py-2 text-right">$ / person</th>
                  <th className="w-10 px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((f) => (
                  <tr key={f.id}>
                    <td className="px-3 py-2">
                      <Input
                        defaultValue={f.name}
                        onBlur={(e) =>
                          e.target.value !== f.name && update.mutate({ id: f.id, name: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={f.seasonId ?? ''}
                        onChange={(e) =>
                          update.mutate({ id: f.id, seasonId: e.target.value || null })
                        }
                        className="h-9 w-full rounded-md border border-stone-200 bg-white px-2 text-sm"
                      >
                        <option value="">Year-round</option>
                        {seasons.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        className="text-right"
                        defaultValue={Number(f.perPersonRate)}
                        onBlur={(e) =>
                          Number(e.target.value) !== Number(f.perPersonRate) &&
                          update.mutate({ id: f.id, perPersonRate: Number(e.target.value) || 0 })
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button size="icon" variant="ghost" onClick={() => remove.mutate({ id: f.id })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && rows.length === 0 && !isAdding && (
          <div className="rounded-md border border-dashed border-stone-200 px-4 py-8 text-center">
            <p className="text-sm text-stone-500">
              No flight rates yet — domestic/charter legs default to a manual line until you add one.
            </p>
          </div>
        )}

        {isAdding ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                New flight rate
              </span>
              <button onClick={() => setIsAdding(false)} className="text-stone-400 hover:text-stone-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-5">
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
                  Route
                </label>
                <Input
                  placeholder="Arusha–Zanzibar"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="col-span-3">
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
                  Season
                </label>
                <select
                  value={draft.seasonId ?? ''}
                  onChange={(e) => setDraft({ ...draft, seasonId: e.target.value || null })}
                  className="h-9 w-full rounded-md border border-stone-200 bg-white px-2 text-sm"
                >
                  <option value="">Year-round</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
                  $ / person
                </label>
                <Input
                  type="number"
                  value={draft.perPersonRate}
                  onChange={(e) => setDraft({ ...draft, perPersonRate: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-2">
                <Button onClick={handleAdd} disabled={create.isPending} className="w-full">
                  <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="w-full justify-center gap-2 border-dashed"
          >
            <Plus className="h-4 w-4" />
            Add flight rate
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
