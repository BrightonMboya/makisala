'use client';

import { useState } from 'react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { toast } from '@repo/ui/toast';
import { Plus, Trash2, Sparkles, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function SeasonsTab() {
  const utils = trpc.useUtils();
  const {
    data: seasons = [],
    isLoading,
    isError,
    refetch,
  } = trpc.rateCards.seasons.list.useQuery();
  const create = trpc.rateCards.seasons.create.useMutation({
    onSuccess: () => {
      utils.rateCards.seasons.list.invalidate();
      setIsAdding(false);
    },
  });
  const update = trpc.rateCards.seasons.update.useMutation({
    onSuccess: () => utils.rateCards.seasons.list.invalidate(),
  });
  const remove = trpc.rateCards.seasons.delete.useMutation({
    onSuccess: () => utils.rateCards.seasons.list.invalidate(),
  });
  const seed = trpc.rateCards.seasons.seedDefaults.useMutation({
    onSuccess: (r) => {
      utils.rateCards.seasons.list.invalidate();
      toast({
        title: r.seeded ? 'East Africa season calendar added' : 'Seasons already exist',
      });
    },
  });

  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState({
    name: '',
    startMonth: 1,
    startDay: 1,
    endMonth: 12,
    endDay: 31,
    priority: 0,
  });

  const handleAdd = async () => {
    if (!draft.name) {
      toast({ title: 'Season name required', variant: 'destructive' });
      return;
    }
    await create.mutateAsync(draft);
    setDraft({ name: '', startMonth: 1, startDay: 1, endMonth: 12, endDay: 31, priority: 0 });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Season calendar</CardTitle>
          <CardDescription>
            Date bands used to pick the right hotel rate per travel date. A season can have
            multiple bands (e.g. High = Jun-Oct and Dec-Jan). Higher priority wins on overlap.
          </CardDescription>
        </div>
        {seasons.length === 0 && (
          <Button onClick={() => seed.mutate()} disabled={seed.isPending} className="shrink-0">
            <Sparkles className="mr-2 h-4 w-4" />
            Seed East Africa defaults
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
            {isError && (
              <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span>Couldn&apos;t load seasons.</span>
                <Button size="sm" variant="outline" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            )}

            {isLoading && seasons.length === 0 && (
              <div className="space-y-2">
                <div className="h-10 animate-pulse rounded-md bg-stone-100" />
                <div className="h-10 animate-pulse rounded-md bg-stone-100" />
              </div>
            )}

            {seasons.length > 0 && (
              <div className="overflow-hidden rounded-md border border-stone-200">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Start</th>
                      <th className="px-3 py-2 text-left">End</th>
                      <th className="w-24 px-3 py-2 text-left">Priority</th>
                      <th className="w-10 px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {seasons.map((s) => (
                      <SeasonRow
                        key={s.id}
                        season={s}
                        onUpdate={(patch) => update.mutate({ id: s.id, ...patch })}
                        onDelete={() => remove.mutate({ id: s.id })}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!isLoading && !isError && seasons.length === 0 && !isAdding && (
              <div className="rounded-md border border-dashed border-stone-200 px-4 py-8 text-center">
                <p className="text-sm text-stone-500">
                  No seasons defined yet. Use the "Seed defaults" button or add one manually.
                </p>
              </div>
            )}

            {isAdding ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    New season band
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
                      placeholder="High / Low / Shoulder"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
                      Start (month / day)
                    </label>
                    <div className="flex gap-1">
                      <MonthSelect
                        value={draft.startMonth}
                        onChange={(v) => setDraft({ ...draft, startMonth: v })}
                      />
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        value={draft.startDay}
                        onChange={(e) =>
                          setDraft({ ...draft, startDay: Number(e.target.value) || 1 })
                        }
                      />
                    </div>
                  </div>
                  <div className="col-span-3">
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
                      End (month / day)
                    </label>
                    <div className="flex gap-1">
                      <MonthSelect
                        value={draft.endMonth}
                        onChange={(v) => setDraft({ ...draft, endMonth: v })}
                      />
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        value={draft.endDay}
                        onChange={(e) =>
                          setDraft({ ...draft, endDay: Number(e.target.value) || 1 })
                        }
                      />
                    </div>
                  </div>
                  <div className="col-span-1">
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
                      Priority
                    </label>
                    <Input
                      type="number"
                      value={draft.priority}
                      onChange={(e) =>
                        setDraft({ ...draft, priority: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Button
                      onClick={handleAdd}
                      disabled={create.isPending}
                      className="w-full"
                    >
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
                Add season band
              </Button>
            )}
      </CardContent>
    </Card>
  );
}

function MonthSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-9 flex-1 rounded-md border border-stone-200 bg-white px-2 text-sm"
    >
      {MONTHS.map((m, i) => (
        <option key={m} value={i + 1}>
          {m}
        </option>
      ))}
    </select>
  );
}

function SeasonRow({
  season,
  onUpdate,
  onDelete,
}: {
  season: {
    id: string;
    name: string;
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
    priority: number;
  };
  onUpdate: (patch: Partial<{
    name: string;
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
    priority: number;
  }>) => void;
  onDelete: () => void;
}) {
  return (
    <tr>
      <td className="px-3 py-2">
        <Input
          defaultValue={season.name}
          onBlur={(e) => e.target.value !== season.name && onUpdate({ name: e.target.value })}
        />
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-1">
          <MonthSelect
            value={season.startMonth}
            onChange={(v) => onUpdate({ startMonth: v })}
          />
          <Input
            type="number"
            min={1}
            max={31}
            className="w-16"
            defaultValue={season.startDay}
            onBlur={(e) =>
              Number(e.target.value) !== season.startDay &&
              onUpdate({ startDay: Number(e.target.value) || 1 })
            }
          />
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-1">
          <MonthSelect
            value={season.endMonth}
            onChange={(v) => onUpdate({ endMonth: v })}
          />
          <Input
            type="number"
            min={1}
            max={31}
            className="w-16"
            defaultValue={season.endDay}
            onBlur={(e) =>
              Number(e.target.value) !== season.endDay &&
              onUpdate({ endDay: Number(e.target.value) || 1 })
            }
          />
        </div>
      </td>
      <td className="px-3 py-2">
        <Input
          type="number"
          defaultValue={season.priority}
          onBlur={(e) =>
            Number(e.target.value) !== season.priority &&
            onUpdate({ priority: Number(e.target.value) || 0 })
          }
        />
      </td>
      <td className="px-3 py-2 text-right">
        <Button size="icon" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}
