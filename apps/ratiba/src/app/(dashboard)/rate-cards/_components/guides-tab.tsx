'use client';

import { useState } from 'react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { toast } from '@repo/ui/toast';
import { Plus, Trash2, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function GuidesTab() {
  const utils = trpc.useUtils();
  const {
    data: guides = [],
    isLoading,
    isError,
    refetch,
  } = trpc.rateCards.guides.list.useQuery();
  const create = trpc.rateCards.guides.create.useMutation({
    onSuccess: () => {
      utils.rateCards.guides.list.invalidate();
      setIsAdding(false);
      toast({ title: 'Guide added' });
    },
  });
  const update = trpc.rateCards.guides.update.useMutation({
    onSuccess: () => {
      utils.rateCards.guides.list.invalidate();
      toast({ title: 'Guide updated' });
    },
  });
  const remove = trpc.rateCards.guides.delete.useMutation({
    onSuccess: () => {
      utils.rateCards.guides.list.invalidate();
      toast({ title: 'Guide removed' });
    },
  });

  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState({
    name: '',
    touringRate: 0,
    airportTransferRate: 0,
  });

  const handleAdd = async () => {
    if (!draft.name) {
      toast({ title: 'Guide name required', variant: 'destructive' });
      return;
    }
    await create.mutateAsync(draft);
    setDraft({ name: '', touringRate: 0, airportTransferRate: 0 });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guides</CardTitle>
        <CardDescription>
          Priced separately from the vehicle: a touring day (out with the group) and a
          same-day airport pickup/dropoff leg are charged at different rates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isError && (
          <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>Couldn&apos;t load guides.</span>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {isLoading && guides.length === 0 && (
          <div className="space-y-2">
            <div className="h-10 animate-pulse rounded-md bg-stone-100" />
            <div className="h-10 animate-pulse rounded-md bg-stone-100" />
          </div>
        )}

        {guides.length > 0 && (
          <div className="overflow-hidden rounded-md border border-stone-200">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="w-32 px-3 py-2 text-right">$ / touring day</th>
                  <th className="w-40 px-3 py-2 text-right">$ / airport transfer</th>
                  <th className="w-10 px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {guides.map((g) => (
                  <tr key={g.id}>
                    <td className="px-3 py-2">
                      <Input
                        defaultValue={g.name}
                        onBlur={(e) =>
                          e.target.value !== g.name && update.mutate({ id: g.id, name: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        className="text-right"
                        defaultValue={Number(g.touringRate)}
                        onBlur={(e) =>
                          Number(e.target.value) !== Number(g.touringRate) &&
                          update.mutate({ id: g.id, touringRate: Number(e.target.value) || 0 })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        className="text-right"
                        defaultValue={Number(g.airportTransferRate)}
                        onBlur={(e) =>
                          Number(e.target.value) !== Number(g.airportTransferRate) &&
                          update.mutate({ id: g.id, airportTransferRate: Number(e.target.value) || 0 })
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button size="icon" variant="ghost" onClick={() => remove.mutate({ id: g.id })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && guides.length === 0 && !isAdding && (
          <div className="rounded-md border border-dashed border-stone-200 px-4 py-8 text-center">
            <p className="text-sm text-stone-500">No guides yet. Add one to price the guide line separately from the vehicle.</p>
          </div>
        )}

        {isAdding ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">New guide</span>
              <button onClick={() => setIsAdding(false)} className="text-stone-400 hover:text-stone-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-5">
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
                  Name
                </label>
                <Input
                  placeholder="Standard guide"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="col-span-3">
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
                  $ / touring day
                </label>
                <Input
                  type="number"
                  value={draft.touringRate}
                  onChange={(e) => setDraft({ ...draft, touringRate: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
                  $ / transfer
                </label>
                <Input
                  type="number"
                  value={draft.airportTransferRate}
                  onChange={(e) =>
                    setDraft({ ...draft, airportTransferRate: Number(e.target.value) || 0 })
                  }
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
            Add guide
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
