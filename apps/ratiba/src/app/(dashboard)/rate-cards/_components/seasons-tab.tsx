'use client';

import { useState } from 'react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { toast } from '@repo/ui/toast';
import { Plus, Trash2, Sparkles } from 'lucide-react';
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
  const { data: seasons = [], isLoading } = trpc.rateCards.seasons.list.useQuery();
  const create = trpc.rateCards.seasons.create.useMutation({
    onSuccess: () => utils.rateCards.seasons.list.invalidate(),
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Season calendar</CardTitle>
            <CardDescription>
              Date bands used to pick the right hotel rate per travel date. A season can have
              multiple bands (e.g. High = Jun-Oct and Dec-Jan).
            </CardDescription>
          </div>
          {seasons.length === 0 && (
            <Button onClick={() => seed.mutate()} disabled={seed.isPending}>
              <Sparkles className="mr-2 h-4 w-4" />
              Seed default East Africa calendar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-stone-500">Loading…</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 border-b border-stone-200 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                <div className="col-span-3">Name</div>
                <div className="col-span-3">Start (month / day)</div>
                <div className="col-span-3">End (month / day)</div>
                <div className="col-span-2">Priority</div>
                <div className="col-span-1" />
              </div>
              {seasons.map((s) => (
                <SeasonRow
                  key={s.id}
                  season={s}
                  onUpdate={(patch) => update.mutate({ id: s.id, ...patch })}
                  onDelete={() => remove.mutate({ id: s.id })}
                />
              ))}
              <div className="grid grid-cols-12 items-center gap-2 border-t border-dashed border-stone-200 pt-3">
                <Input
                  className="col-span-3"
                  placeholder="High / Low / Shoulder"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
                <div className="col-span-3 flex gap-1">
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
                <div className="col-span-3 flex gap-1">
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
                <Input
                  type="number"
                  className="col-span-2"
                  value={draft.priority}
                  onChange={(e) =>
                    setDraft({ ...draft, priority: Number(e.target.value) || 0 })
                  }
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleAdd}
                  disabled={create.isPending}
                  className="col-span-1"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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
    <div className="grid grid-cols-12 items-center gap-2 rounded-md border border-stone-100 bg-stone-50 px-2 py-1">
      <Input
        className="col-span-3"
        defaultValue={season.name}
        onBlur={(e) => e.target.value !== season.name && onUpdate({ name: e.target.value })}
      />
      <div className="col-span-3 flex gap-1">
        <MonthSelect
          value={season.startMonth}
          onChange={(v) => onUpdate({ startMonth: v })}
        />
        <Input
          type="number"
          min={1}
          max={31}
          defaultValue={season.startDay}
          onBlur={(e) =>
            Number(e.target.value) !== season.startDay &&
            onUpdate({ startDay: Number(e.target.value) || 1 })
          }
        />
      </div>
      <div className="col-span-3 flex gap-1">
        <MonthSelect
          value={season.endMonth}
          onChange={(v) => onUpdate({ endMonth: v })}
        />
        <Input
          type="number"
          min={1}
          max={31}
          defaultValue={season.endDay}
          onBlur={(e) =>
            Number(e.target.value) !== season.endDay &&
            onUpdate({ endDay: Number(e.target.value) || 1 })
          }
        />
      </div>
      <Input
        type="number"
        className="col-span-2"
        defaultValue={season.priority}
        onBlur={(e) =>
          Number(e.target.value) !== season.priority &&
          onUpdate({ priority: Number(e.target.value) || 0 })
        }
      />
      <Button size="icon" variant="ghost" onClick={onDelete} className="col-span-1">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
