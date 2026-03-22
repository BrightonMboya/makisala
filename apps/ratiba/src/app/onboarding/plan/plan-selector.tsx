'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Switch } from '@repo/ui/switch';
import { Button } from '@repo/ui/button';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  Image,
  Loader2,
  MessageSquare,
  Palette,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { checkout } from '@/lib/auth-client';
import { toast } from '@repo/ui/toast';
import { PLAN_CONFIG, type PlanTier } from '@/lib/plans-config';

const YEARLY_DISCOUNT = 0.17;

const PLAN_TAGLINES: Record<PlanTier, string> = {
  free: 'For solo operators getting started with their first proposals.',
  starter: 'For small agencies that need PDF exports and more proposals.',
  pro: 'For growing agencies with teams, custom images, and all themes.',
  business: 'For established agencies that need custom domains and unlimited seats.',
};

const PLAN_FEATURES: Partial<Record<PlanTier, { text: string; icon: typeof FileText; disabled?: boolean }[]>> = {
  starter: [
    { text: '5 active proposals', icon: FileText },
    { text: 'Content library', icon: FileText },
    { text: 'PDF export', icon: FileText },
    { text: 'Minimalistic theme', icon: Palette },
    { text: 'Own image uploads', icon: Image, disabled: true },
    { text: 'Team members', icon: Users, disabled: true },
  ],
  pro: [
    { text: 'Unlimited proposals', icon: FileText },
    { text: 'All 4 themes', icon: Palette },
    { text: 'Own image uploads', icon: Image },
    { text: '3 team members', icon: Users },
    { text: 'PDF export', icon: FileText },
    { text: 'Comments', icon: MessageSquare },
    { text: 'No watermark', icon: Sparkles },
  ],
  business: [
    { text: 'Unlimited proposals', icon: FileText },
    { text: 'All 4 themes', icon: Palette },
    { text: 'Own image uploads', icon: Image },
    { text: 'Unlimited team members', icon: Users },
    { text: 'PDF export', icon: FileText },
    { text: 'Comments', icon: MessageSquare },
    { text: 'No watermark', icon: Sparkles },
    { text: 'Custom domains', icon: Globe },
  ],
};

const PAID_TIERS: PlanTier[] = ['starter', 'pro', 'business'];

const HIGHLIGHT_TIER = 'pro';

export function PlanSelector() {
  const [yearly, setYearly] = useState(false);
  const [mobilePlanIndex, setMobilePlanIndex] = useState(1); // Start on Pro
  const [checkingOutSlug, setCheckingOutSlug] = useState<string | null>(null);

  async function handleCheckout(slug: string) {
    setCheckingOutSlug(slug);
    try {
      // checkout() calls /api/auth/checkout which returns { url, redirect: true }
      // better-auth's redirectPlugin auto-navigates via window.location.href
      // The promise resolves after the redirect starts, but page may navigate away first
      const res = await checkout({ slug });

      // If redirectPlugin didn't fire (e.g., error response), handle manually
      if (res?.error) {
        toast({ title: res.error.message || 'Failed to start checkout', variant: 'destructive' });
        setCheckingOutSlug(null);
        return;
      }

      // Fallback: if we still have the URL but redirect didn't happen
      if (res?.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start checkout';
      toast({ title: message, variant: 'destructive' });
      setCheckingOutSlug(null);
    }
  }

  return (
    <div className="overflow-hidden [container-type:inline-size]">
      {/* Single billing toggle above all plans */}
      <div className="mb-5 flex items-center justify-center">
        <label className="flex cursor-pointer items-center gap-2">
          <span className={`text-sm font-medium ${!yearly ? 'text-stone-900' : 'text-stone-500'}`}>Monthly</span>
          <Switch
            checked={yearly}
            onCheckedChange={setYearly}
            className="h-5 w-9 data-[state=checked]:bg-green-700"
          />
          <span className={`text-sm font-medium ${yearly ? 'text-stone-900' : 'text-stone-500'}`}>Yearly</span>
          <span
            className={`inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 transition-all duration-150 ${
              yearly ? 'opacity-100' : '-translate-x-2 opacity-0'
            }`}
          >
            Save {Math.round(YEARLY_DISCOUNT * 100)}%
          </span>
        </label>
      </div>

      <div
        className="mx-auto grid max-w-[calc(var(--cols)*280px)] grid-cols-[repeat(var(--cols),1fr)] max-lg:w-[calc(var(--cols)*100cqw+(var(--cols)-1)*32px)] max-lg:max-w-none max-lg:translate-x-[calc(-1*var(--index)*(100cqw+32px))] max-lg:gap-x-8 max-lg:transition-transform"
        style={
          {
            '--cols': PAID_TIERS.length,
            '--index': mobilePlanIndex,
          } as CSSProperties
        }
      >
        {PAID_TIERS.map((tier) => {
          const config = PLAN_CONFIG[tier];
          const features = PLAN_FEATURES[tier] ?? [];
          const isHighlighted = tier === HIGHLIGHT_TIER;

          return (
            <div
              key={tier}
              className={`flex flex-col border-y border-l border-stone-200 bg-white first:rounded-l-xl last:rounded-r-xl last:border-r ${
                isHighlighted ? 'bg-gradient-to-b from-green-50 to-40%' : ''
              }`}
            >
              <div className="flex grow flex-col gap-5 p-5 pb-3">
                {/* Plan name + badge */}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-stone-800">
                      {config.name}
                    </h2>
                    {isHighlighted && (
                      <div className="w-fit whitespace-nowrap rounded-full bg-green-900 px-2 py-1.5 text-center text-[0.5rem] font-medium uppercase leading-none text-white">
                        Popular
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mt-1">
                    <span className="text-base tabular-nums text-stone-700">
                      ${yearly ? Math.round(config.price * (1 - YEARLY_DISCOUNT)) : config.price}
                    </span>
                    <span className="text-sm text-stone-400"> per month</span>
                  </div>
                </div>

                {/* Tagline */}
                <p className="min-h-10 text-sm text-stone-600">
                  {PLAN_TAGLINES[tier]}
                </p>

                {/* CTA + mobile nav */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="h-full w-fit rounded-lg bg-stone-100 px-2.5 transition-colors duration-75 hover:bg-stone-200/80 active:bg-stone-200 disabled:opacity-30 lg:hidden"
                    disabled={mobilePlanIndex === 0}
                    onClick={() => setMobilePlanIndex(mobilePlanIndex - 1)}
                  >
                    <ChevronLeft className="h-5 w-5 text-stone-800" />
                  </button>
                  <Button
                    className={`h-10 w-full rounded-lg shadow-sm ${
                      isHighlighted
                        ? 'bg-green-700 hover:bg-green-800'
                        : 'bg-stone-900 hover:bg-stone-800'
                    }`}
                    onClick={() => handleCheckout(tier)}
                    disabled={checkingOutSlug !== null}
                  >
                    {checkingOutSlug === tier ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    Get started
                  </Button>
                  <button
                    type="button"
                    className="h-full w-fit rounded-lg bg-stone-100 px-2.5 transition-colors duration-75 hover:bg-stone-200/80 active:bg-stone-200 disabled:opacity-30 lg:hidden"
                    disabled={mobilePlanIndex >= PAID_TIERS.length - 1}
                    onClick={() => setMobilePlanIndex(mobilePlanIndex + 1)}
                  >
                    <ChevronRight className="h-5 w-5 text-stone-800" />
                  </button>
                </div>

                {/* Feature list */}
                <ul className="flex flex-col gap-2.5 pb-3 text-sm">
                  {features.map((feature) => (
                    <li
                      key={feature.text}
                      className={`flex items-center gap-2 text-stone-600 ${
                        feature.disabled ? 'opacity-40' : ''
                      }`}
                    >
                      {feature.disabled ? (
                        <X className="h-3 w-3 shrink-0" />
                      ) : (
                        <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
                      )}
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
