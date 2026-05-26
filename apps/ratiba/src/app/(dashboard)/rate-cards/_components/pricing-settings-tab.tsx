'use client';

import { useEffect, useState } from 'react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Label } from '@repo/ui/label';
import { toast } from '@repo/ui/toast';
import { trpc } from '@/lib/trpc';

const CATEGORY_LABELS: Record<string, string> = {
  non_resident_adult: 'Non-resident adult',
  non_resident_child: 'Non-resident child',
  east_african_resident_adult: 'East African resident adult',
  east_african_resident_child: 'East African resident child',
  citizen_adult: 'Citizen adult',
  citizen_child: 'Citizen child',
};

export function PricingSettingsTab() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.rateCards.settings.get.useQuery();
  const upsert = trpc.rateCards.settings.upsert.useMutation({
    onSuccess: () => {
      utils.rateCards.settings.get.invalidate();
      toast({ title: 'Pricing settings saved' });
    },
  });

  const [form, setForm] = useState({
    defaultMarkupPct: 30,
    defaultCurrency: 'USD',
    defaultTravelerCategory: 'non_resident_adult',
  });

  useEffect(() => {
    if (data) {
      setForm({
        defaultMarkupPct: Number(data.defaultMarkupPct),
        defaultCurrency: data.defaultCurrency,
        defaultTravelerCategory: data.defaultTravelerCategory,
      });
    }
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing defaults</CardTitle>
        <CardDescription>
          Default markup % and traveler category applied to new itineraries.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-stone-500">Loading…</p>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Default markup % on cost</Label>
              <Input
                type="number"
                value={form.defaultMarkupPct}
                onChange={(e) =>
                  setForm({ ...form, defaultMarkupPct: Number(e.target.value) || 0 })
                }
              />
              <p className="text-xs text-stone-500">
                Selling price = cost × (1 + markup / 100). 30 → cost × 1.30.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Default currency</Label>
              <Input
                value={form.defaultCurrency}
                maxLength={3}
                onChange={(e) =>
                  setForm({ ...form, defaultCurrency: e.target.value.toUpperCase() })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Default traveler park-fee category</Label>
              <select
                value={form.defaultTravelerCategory}
                onChange={(e) =>
                  setForm({ ...form, defaultTravelerCategory: e.target.value })
                }
                className="h-9 w-full rounded-md border border-stone-200 bg-white px-2 text-sm"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <p className="text-xs text-stone-500">
                Applied to all travelers in v1. Per-pax overrides land in a later release.
              </p>
            </div>
            <Button
              onClick={() =>
                upsert.mutate({
                  defaultMarkupPct: form.defaultMarkupPct,
                  defaultCurrency: form.defaultCurrency,
                  defaultTravelerCategory:
                    form.defaultTravelerCategory as
                      | 'non_resident_adult'
                      | 'non_resident_child'
                      | 'east_african_resident_adult'
                      | 'east_african_resident_child'
                      | 'citizen_adult'
                      | 'citizen_child',
                })
              }
              disabled={upsert.isPending}
            >
              Save
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
