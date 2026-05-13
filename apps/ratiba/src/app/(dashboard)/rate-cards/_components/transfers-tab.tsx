'use client';

import { useState } from 'react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { toast } from '@repo/ui/toast';
import { Plus, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function TransfersTab() {
  const utils = trpc.useUtils();
  const { data: rows = [], isLoading } = trpc.rateCards.transferRates.list.useQuery();
  const create = trpc.rateCards.transferRates.create.useMutation({
    onSuccess: () => utils.rateCards.transferRates.list.invalidate(),
  });
  const update = trpc.rateCards.transferRates.update.useMutation({
    onSuccess: () => utils.rateCards.transferRates.list.invalidate(),
  });
  const remove = trpc.rateCards.transferRates.delete.useMutation({
    onSuccess: () => utils.rateCards.transferRates.list.invalidate(),
  });

  const [draft, setDraft] = useState<{
    name: string;
    mode: 'per_vehicle' | 'per_pax';
    rate: number;
    currency: string;
  }>({
    name: '',
    mode: 'per_vehicle',
    rate: 0,
    currency: 'USD',
  });

  const handleAdd = async () => {
    if (!draft.name) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    await create.mutateAsync(draft);
    setDraft({ name: '', mode: 'per_vehicle', rate: 0, currency: 'USD' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer rates</CardTitle>
        <CardDescription>
          Airport pickups, dropoffs and inter-camp shuttles. Choose per-vehicle (flat) or per-pax.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-stone-500">Loading…</p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 border-b border-stone-200 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
              <div className="col-span-5">Name</div>
              <div className="col-span-3">Mode</div>
              <div className="col-span-2">Rate</div>
              <div className="col-span-1">Ccy</div>
              <div className="col-span-1" />
            </div>
            {rows.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-12 items-center gap-2 rounded-md border border-stone-100 bg-stone-50 px-2 py-1"
              >
                <Input
                  className="col-span-5"
                  defaultValue={r.name}
                  onBlur={(e) =>
                    e.target.value !== r.name &&
                    update.mutate({ id: r.id, name: e.target.value })
                  }
                />
                <select
                  value={r.mode}
                  onChange={(e) =>
                    update.mutate({
                      id: r.id,
                      mode: e.target.value as 'per_vehicle' | 'per_pax',
                    })
                  }
                  className="col-span-3 h-9 rounded-md border border-stone-200 bg-white px-2 text-sm"
                >
                  <option value="per_vehicle">Per vehicle</option>
                  <option value="per_pax">Per pax</option>
                </select>
                <Input
                  type="number"
                  className="col-span-2"
                  defaultValue={Number(r.rate)}
                  onBlur={(e) =>
                    Number(e.target.value) !== Number(r.rate) &&
                    update.mutate({ id: r.id, rate: Number(e.target.value) || 0 })
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
              <Input
                className="col-span-5"
                placeholder="JRO Airport Pickup"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
              <select
                value={draft.mode}
                onChange={(e) =>
                  setDraft({ ...draft, mode: e.target.value as 'per_vehicle' | 'per_pax' })
                }
                className="col-span-3 h-9 rounded-md border border-stone-200 bg-white px-2 text-sm"
              >
                <option value="per_vehicle">Per vehicle</option>
                <option value="per_pax">Per pax</option>
              </select>
              <Input
                type="number"
                className="col-span-2"
                value={draft.rate}
                onChange={(e) => setDraft({ ...draft, rate: Number(e.target.value) || 0 })}
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
