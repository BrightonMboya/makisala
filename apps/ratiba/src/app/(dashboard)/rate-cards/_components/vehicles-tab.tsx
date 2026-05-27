'use client';

import { useState } from 'react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { toast } from '@repo/ui/toast';
import { Plus, Trash2, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function VehiclesTab() {
  const utils = trpc.useUtils();
  const {
    data: vehicles = [],
    isLoading,
    isError,
    refetch,
  } = trpc.rateCards.vehicles.list.useQuery();
  const create = trpc.rateCards.vehicles.create.useMutation({
    onSuccess: () => {
      utils.rateCards.vehicles.list.invalidate();
      setIsAdding(false);
      toast({ title: 'Vehicle added' });
    },
  });
  const update = trpc.rateCards.vehicles.update.useMutation({
    onSuccess: () => {
      utils.rateCards.vehicles.list.invalidate();
      toast({ title: 'Vehicle updated' });
    },
  });
  const remove = trpc.rateCards.vehicles.delete.useMutation({
    onSuccess: () => {
      utils.rateCards.vehicles.list.invalidate();
      toast({ title: 'Vehicle removed' });
    },
  });

  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState({
    name: '',
    description: '',
    capacity: 6,
    perDayRate: 0,
  });

  const handleAdd = async () => {
    if (!draft.name) {
      toast({ title: 'Vehicle name required', variant: 'destructive' });
      return;
    }
    await create.mutateAsync(draft);
    setDraft({ name: '', description: '', capacity: 6, perDayRate: 0 });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicles</CardTitle>
        <CardDescription>
          All-in per-day rate covers vehicle, driver-guide and fuel.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
            {isError && (
              <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span>Couldn&apos;t load vehicles.</span>
                <Button size="sm" variant="outline" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            )}

            {isLoading && vehicles.length === 0 && (
              <div className="space-y-2">
                <div className="h-10 animate-pulse rounded-md bg-stone-100" />
                <div className="h-10 animate-pulse rounded-md bg-stone-100" />
              </div>
            )}

            {vehicles.length > 0 && (
              <div className="overflow-hidden rounded-md border border-stone-200">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="w-20 px-3 py-2 text-left">Pax</th>
                      <th className="w-28 px-3 py-2 text-right">$ / day</th>
                      <th className="w-10 px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {vehicles.map((v) => (
                      <tr key={v.id}>
                        <td className="px-3 py-2">
                          <Input
                            defaultValue={v.name}
                            onBlur={(e) =>
                              e.target.value !== v.name &&
                              update.mutate({ id: v.id, name: e.target.value })
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            defaultValue={v.description ?? ''}
                            onBlur={(e) =>
                              e.target.value !== (v.description ?? '') &&
                              update.mutate({ id: v.id, description: e.target.value })
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            defaultValue={v.capacity}
                            onBlur={(e) =>
                              Number(e.target.value) !== v.capacity &&
                              update.mutate({
                                id: v.id,
                                capacity: Number(e.target.value) || 1,
                              })
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            className="text-right"
                            defaultValue={Number(v.perDayRate)}
                            onBlur={(e) =>
                              Number(e.target.value) !== Number(v.perDayRate) &&
                              update.mutate({
                                id: v.id,
                                perDayRate: Number(e.target.value) || 0,
                              })
                            }
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => remove.mutate({ id: v.id })}
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

            {!isLoading && !isError && vehicles.length === 0 && !isAdding && (
              <div className="rounded-md border border-dashed border-stone-200 px-4 py-8 text-center">
                <p className="text-sm text-stone-500">
                  No vehicles yet. Add your fleet to enable per-day pricing.
                </p>
              </div>
            )}

            {isAdding ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    New vehicle
                  </span>
                  <button
                    onClick={() => setIsAdding(false)}
                    className="text-stone-400 hover:text-stone-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-12 items-end gap-2">
                  <div className="col-span-3">
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
                      Name
                    </label>
                    <Input
                      placeholder="4x4 Land Cruiser"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
                      Description
                    </label>
                    <Input
                      placeholder="7-seat pop-up roof"
                      value={draft.description}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
                      Pax
                    </label>
                    <Input
                      type="number"
                      value={draft.capacity}
                      onChange={(e) =>
                        setDraft({ ...draft, capacity: Number(e.target.value) || 1 })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
                      $ / day
                    </label>
                    <Input
                      type="number"
                      value={draft.perDayRate}
                      onChange={(e) =>
                        setDraft({ ...draft, perDayRate: Number(e.target.value) || 0 })
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
                Add vehicle
              </Button>
            )}
      </CardContent>
    </Card>
  );
}
