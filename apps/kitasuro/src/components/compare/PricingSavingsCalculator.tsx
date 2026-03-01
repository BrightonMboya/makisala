'use client';

import { useMemo, useState } from 'react';
import { Slider } from '@repo/ui/slider';
import { PLAN_CONFIG } from '@/lib/plans-config';

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

type PricingSavingsCalculatorProps = {
  competitorName?: string;
  defaultPerSeat?: number;
};

export function PricingSavingsCalculator({
  competitorName = 'Competitor',
  defaultPerSeat = 79,
}: PricingSavingsCalculatorProps) {
  const [teamSize, setTeamSize] = useState(6);
  const [competitorPerUser, setCompetitorPerUser] = useState(defaultPerSeat);

  const result = useMemo(() => {
    const starterPrice = PLAN_CONFIG.starter.price;
    const proPrice = PLAN_CONFIG.pro.price;
    const businessPrice = PLAN_CONFIG.business.price;
    // teamMembers limit is additional members (0 = solo, 3 = owner + 3)
    const proTeamLimit = PLAN_CONFIG.pro.limits.teamMembers + 1; // total people including owner

    let kitasuroMonthly: number;
    let kitasuroPlan: string;
    if (teamSize <= 1) {
      kitasuroMonthly = starterPrice;
      kitasuroPlan = 'Starter';
    } else if (teamSize <= proTeamLimit) {
      kitasuroMonthly = proPrice;
      kitasuroPlan = 'Pro';
    } else {
      kitasuroMonthly = businessPrice;
      kitasuroPlan = 'Business';
    }

    const competitorMonthly = teamSize * competitorPerUser;
    const monthlySavings = competitorMonthly - kitasuroMonthly;
    const annualSavings = monthlySavings * 12;

    const maxMonthly = Math.max(kitasuroMonthly, competitorMonthly, 1);

    return {
      kitasuroMonthly,
      kitasuroPlan,
      competitorMonthly,
      monthlySavings,
      annualSavings,
      kitasuroBar: (kitasuroMonthly / maxMonthly) * 100,
      competitorBar: (competitorMonthly / maxMonthly) * 100,
    };
  }, [teamSize, competitorPerUser]);

  const isSaving = result.annualSavings >= 0;

  return (
    <section
      id="pricing"
      className="border-border/60 from-card/80 to-card/50 relative overflow-hidden rounded-2xl border bg-gradient-to-b p-6 sm:p-8"
      aria-labelledby="pricing-calculator-title"
    >
      <div className="from-primary/12 pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-gradient-to-br to-transparent blur-2xl" />
      <div className="relative">
        <h2
          id="pricing-calculator-title"
          className="font-heading text-3xl font-bold tracking-tight"
        >
          Pricing savings calculator
        </h2>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
          Compare Ratiba fixed plans with {competitorName} and estimate annual cost difference for
          your team size.
        </p>

        <div className="mt-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5">
          <p className="text-xs font-semibold tracking-wide uppercase">
            {isSaving ? 'Estimated annual savings with Ratiba' : 'Estimated annual difference'}
          </p>
          <p className="font-heading mt-2 text-3xl font-bold sm:text-4xl">
            {isSaving
              ? formatMoney(result.annualSavings)
              : `${formatMoney(Math.abs(result.annualSavings))} higher`}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Monthly delta: {isSaving ? '+' : '-'}
            {formatMoney(Math.abs(result.monthlySavings))}
          </p>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="team-size" className="text-sm font-medium">
                Team members
              </label>
              <span className="bg-background/85 rounded-full px-3 py-1 text-sm font-semibold">
                {teamSize}
              </span>
            </div>
            <Slider
              id="team-size"
              min={1}
              max={40}
              step={1}
              value={[teamSize]}
              onValueChange={(value) => setTeamSize(value[0] ?? 1)}
            />
            <div className="text-muted-foreground mt-1 flex justify-between text-xs">
              <span>1</span>
              <span>40</span>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="competitor-seat" className="text-sm font-medium">
                Competitor cost per seat / month
              </label>
              <span className="bg-background/85 rounded-full px-3 py-1 text-sm font-semibold">
                {formatMoney(competitorPerUser)}
              </span>
            </div>
            <Slider
              id="competitor-seat"
              min={20}
              max={200}
              step={1}
              value={[competitorPerUser]}
              onValueChange={(value) => setCompetitorPerUser(value[0] ?? 20)}
            />
            <div className="text-muted-foreground mt-1 flex justify-between text-xs">
              <span>{formatMoney(20)}</span>
              <span>{formatMoney(200)}</span>
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-3">
          <article className="border-border/70 bg-background/80 rounded-xl border p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <p className="font-medium">Ratiba {result.kitasuroPlan} monthly</p>
              <p className="font-semibold">{formatMoney(result.kitasuroMonthly)}</p>
            </div>
            <div className="bg-muted h-2.5 rounded-full">
              <div
                className="bg-primary h-2.5 rounded-full"
                style={{ width: `${Math.max(result.kitasuroBar, 6)}%` }}
              />
            </div>
          </article>

          <article className="border-border/70 bg-background/80 rounded-xl border p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <p className="font-medium">{competitorName} monthly</p>
              <p className="font-semibold">{formatMoney(result.competitorMonthly)}</p>
            </div>
            <div className="bg-muted h-2.5 rounded-full">
              <div
                className="h-2.5 rounded-full bg-orange-500"
                style={{ width: `${Math.max(result.competitorBar, 6)}%` }}
              />
            </div>
          </article>
        </div>
      </div>

      <p className="text-muted-foreground mt-5 text-xs">
        Estimate only. Competitor pricing varies by plan tier, contract terms, add-ons, and region.
      </p>
    </section>
  );
}
