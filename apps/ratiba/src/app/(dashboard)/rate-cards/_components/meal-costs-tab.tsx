'use client';

import { useState } from 'react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { toast } from '@repo/ui/toast';
import { Plus, Trash2, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function MealCostsTab() {
  const utils = trpc.useUtils();
  const {
    data: rows = [],
    isLoading,
    isError,
    refetch,
  } = trpc.rateCards.mealCostRates.list.useQuery();
  const create = trpc.rateCards.mealCostRates.create.useMutation({
    onSuccess: () => {
      utils.rateCards.mealCostRates.list.invalidate();
      setIsAdding(false);
      toast({ title: 'Meal cost added' });
    },
  });
  const update = trpc.rateCards.mealCostRates.update.useMutation({
    onSuccess: () => {
      utils.rateCards.mealCostRates.list.invalidate();
      toast({ title: 'Meal cost updated' });
    },
  });
  const remove = trpc.rateCards.mealCostRates.delete.useMutation({
    onSuccess: () => {
      utils.rateCards.mealCostRates.list.invalidate();
      toast({ title: 'Meal cost removed' });
    },
  });

  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', perPersonRate: 0 });

  const handleAdd = async () => {
    if (!draft.name) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    await create.mutateAsync(draft);
    setDraft({ name: '', perPersonRate: 0 });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meal costs</CardTitle>
        <CardDescription>
          Flat per-person costs for a day with no lodge meal available — e.g. a boxed lunch
          on a relocation day.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isError && (
          <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>Couldn&apos;t load meal costs.</span>
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
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="w-32 px-3 py-2 text-right">$ / person</th>
                  <th className="w-10 px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((m) => (
                  <tr key={m.id}>
                    <td className="px-3 py-2">
                      <Input
                        defaultValue={m.name}
                        onBlur={(e) =>
                          e.target.value !== m.name && update.mutate({ id: m.id, name: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        className="text-right"
                        defaultValue={Number(m.perPersonRate)}
                        onBlur={(e) =>
                          Number(e.target.value) !== Number(m.perPersonRate) &&
                          update.mutate({ id: m.id, perPersonRate: Number(e.target.value) || 0 })
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button size="icon" variant="ghost" onClick={() => remove.mutate({ id: m.id })}>
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
            <p className="text-sm text-stone-500">No meal costs yet. Add a lunchbox rate to stop losing it as a forgotten manual line.</p>
          </div>
        )}

        {isAdding ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                New meal cost
              </span>
              <button onClick={() => setIsAdding(false)} className="text-stone-400 hover:text-stone-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-7">
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
                  Name
                </label>
                <Input
                  placeholder="Lunchbox"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="col-span-3">
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
            Add meal cost
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
