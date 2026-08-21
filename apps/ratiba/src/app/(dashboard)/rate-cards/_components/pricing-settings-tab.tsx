'use client';

import { useEffect, useState } from 'react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Label } from '@repo/ui/label';
import { toast } from '@repo/ui/toast';
import { Plus, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

const CATEGORY_LABELS: Record<string, string> = {
  non_resident_adult: 'Non-resident adult',
  non_resident_child: 'Non-resident child',
  east_african_resident_adult: 'East African resident adult',
  east_african_resident_child: 'East African resident child',
  citizen_adult: 'Citizen adult',
  citizen_child: 'Citizen child',
};

type MarkupTier = { minPax: number; markupPct: number };

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
  const [tiers, setTiers] = useState<MarkupTier[]>([]);

  useEffect(() => {
    if (data) {
      setForm({
        defaultMarkupPct: Number(data.defaultMarkupPct),
        defaultCurrency: data.defaultCurrency,
        defaultTravelerCategory: data.defaultTravelerCategory,
      });
      setTiers(data.markupTiers ?? []);
    }
  }, [data]);

  const updateTier = (index: number, patch: Partial<MarkupTier>) => {
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const removeTier = (index: number) => {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const addTier = () => {
    const lastMinPax = tiers.length > 0 ? tiers[tiers.length - 1]!.minPax : 1;
    setTiers((prev) => [...prev, { minPax: lastMinPax + 1, markupPct: form.defaultMarkupPct }]);
  };

  const save = () => {
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
      markupTiers: tiers.length > 0 ? tiers : null,
    });
  };

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

            <div className="space-y-2 border-t border-stone-100 pt-4">
              <Label>Markup by group size (optional)</Label>
              <p className="text-xs text-stone-500">
                Retain a different margin at larger group sizes instead of one flat percentage —
                e.g. shared costs (vehicle, guide) dilute across more travelers, but you want to
                keep some of that saving rather than pass all of it through. The tier with the
                highest &quot;min pax&quot; at or below the party size wins; below every tier, the
                flat default above applies.
              </p>

              {tiers.length > 0 && (
                <div className="overflow-hidden rounded-md border border-stone-200">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Min pax</th>
                        <th className="px-3 py-2 text-left">Markup %</th>
                        <th className="w-10 px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {tiers.map((tier, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min={1}
                              value={tier.minPax}
                              onChange={(e) =>
                                updateTier(i, { minPax: Number(e.target.value) || 1 })
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              value={tier.markupPct}
                              onChange={(e) =>
                                updateTier(i, { markupPct: Number(e.target.value) || 0 })
                              }
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Button size="icon" variant="ghost" onClick={() => removeTier(i)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <Button
                variant="outline"
                onClick={addTier}
                className="w-full justify-center gap-2 border-dashed"
              >
                <Plus className="h-4 w-4" />
                Add tier
              </Button>
            </div>

            <Button onClick={save} disabled={upsert.isPending}>
              Save
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
