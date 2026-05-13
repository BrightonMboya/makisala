'use client';

import { useState } from 'react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { toast } from '@repo/ui/toast';
import { Plus, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function VehiclesTab() {
  const utils = trpc.useUtils();
  const { data: vehicles = [], isLoading } = trpc.rateCards.vehicles.list.useQuery();
  const create = trpc.rateCards.vehicles.create.useMutation({
    onSuccess: () => utils.rateCards.vehicles.list.invalidate(),
  });
  const update = trpc.rateCards.vehicles.update.useMutation({
    onSuccess: () => utils.rateCards.vehicles.list.invalidate(),
  });
  const remove = trpc.rateCards.vehicles.delete.useMutation({
    onSuccess: () => utils.rateCards.vehicles.list.invalidate(),
  });

  const [draft, setDraft] = useState({
    name: '',
    description: '',
    capacity: 6,
    perDayRate: 0,
    currency: 'USD',
  });

  const handleAdd = async () => {
    if (!draft.name) {
      toast({ title: 'Vehicle name required', variant: 'destructive' });
      return;
    }
    await create.mutateAsync(draft);
    setDraft({ name: '', description: '', capacity: 6, perDayRate: 0, currency: 'USD' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicles</CardTitle>
        <CardDescription>
          All-in per-day rate covers vehicle, driver-guide and fuel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-stone-500">Loading…</p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 border-b border-stone-200 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
              <div className="col-span-4">Name</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-1">Pax</div>
              <div className="col-span-2">$ / day</div>
              <div className="col-span-1">Ccy</div>
              <div className="col-span-1" />
            </div>
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="grid grid-cols-12 items-center gap-2 rounded-md border border-stone-100 bg-stone-50 px-2 py-1"
              >
                <Input
                  className="col-span-4"
                  defaultValue={v.name}
                  onBlur={(e) =>
                    e.target.value !== v.name &&
                    update.mutate({ id: v.id, name: e.target.value })
                  }
                />
                <Input
                  className="col-span-3"
                  defaultValue={v.description ?? ''}
                  onBlur={(e) =>
                    e.target.value !== (v.description ?? '') &&
                    update.mutate({ id: v.id, description: e.target.value })
                  }
                />
                <Input
                  type="number"
                  className="col-span-1"
                  defaultValue={v.capacity}
                  onBlur={(e) =>
                    Number(e.target.value) !== v.capacity &&
                    update.mutate({ id: v.id, capacity: Number(e.target.value) || 1 })
                  }
                />
                <Input
                  type="number"
                  className="col-span-2"
                  defaultValue={Number(v.perDayRate)}
                  onBlur={(e) =>
                    Number(e.target.value) !== Number(v.perDayRate) &&
                    update.mutate({ id: v.id, perDayRate: Number(e.target.value) || 0 })
                  }
                />
                <Input
                  className="col-span-1"
                  defaultValue={v.currency}
                  onBlur={(e) =>
                    e.target.value !== v.currency &&
                    update.mutate({ id: v.id, currency: e.target.value.toUpperCase() })
                  }
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="col-span-1"
                  onClick={() => remove.mutate({ id: v.id })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="grid grid-cols-12 items-center gap-2 border-t border-dashed border-stone-200 pt-3">
              <Input
                className="col-span-4"
                placeholder="4x4 Land Cruiser"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
              <Input
                className="col-span-3"
                placeholder="Description"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
              <Input
                type="number"
                className="col-span-1"
                value={draft.capacity}
                onChange={(e) =>
                  setDraft({ ...draft, capacity: Number(e.target.value) || 1 })
                }
              />
              <Input
                type="number"
                className="col-span-2"
                value={draft.perDayRate}
                onChange={(e) =>
                  setDraft({ ...draft, perDayRate: Number(e.target.value) || 0 })
                }
              />
              <Input
                className="col-span-1"
                value={draft.currency}
                onChange={(e) =>
                  setDraft({ ...draft, currency: e.target.value.toUpperCase() })
                }
              />
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
