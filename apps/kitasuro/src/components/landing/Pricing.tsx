import { PLAN_CONFIG, type PlanTier } from '@/lib/plans-config';
import { CheckCircle2, X } from 'lucide-react';
import Link from 'next/link';

const TIER_ORDER: PlanTier[] = ['free', 'starter', 'pro', 'business'];

const FEATURES: { label: string; tiers: Record<PlanTier, string> }[] = [
  {
    label: 'Active proposals',
    tiers: { free: '2', starter: '5', pro: 'Unlimited', business: 'Unlimited' },
  },
  {
    label: 'Own image uploads',
    tiers: { free: 'No', starter: 'No', pro: 'Yes', business: 'Yes' },
  },
  {
    label: 'Team members',
    tiers: { free: '—', starter: '—', pro: '3', business: 'Unlimited' },
  },
  {
    label: 'Themes',
    tiers: { free: '1', starter: '1', pro: 'All 4', business: 'All 4' },
  },
  {
    label: 'No watermark',
    tiers: { free: 'No', starter: 'No', pro: 'Yes', business: 'Yes' },
  },
  {
    label: 'PDF export',
    tiers: { free: 'No', starter: 'Yes', pro: 'Yes', business: 'Yes' },
  },
  {
    label: 'Comments',
    tiers: { free: 'No', starter: 'No', pro: 'Yes', business: 'Yes' },
  },
  {
    label: 'Custom domains',
    tiers: { free: 'No', starter: 'No', pro: 'No', business: 'Yes' },
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-muted/30 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Pick a plan that fits your team
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Start free with 2 proposals. Upgrade when you need more.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TIER_ORDER.map((tier) => {
            const config = PLAN_CONFIG[tier];
            const isPopular = tier === 'pro';

            return (
              <div
                key={tier}
                className={`relative flex flex-col rounded-2xl border p-8 transition-colors ${
                  isPopular
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border/50 bg-card/50 hover:border-border/80 hover:bg-card/80'
                }`}
              >
                {isPopular && (
                  <span className="bg-primary text-primary-foreground absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-medium">
                    Popular
                  </span>
                )}

                <div className="mb-6">
                  <h3 className="font-heading text-lg font-semibold tracking-tight">
                    {config.name}
                  </h3>
                  <div className="mt-2">
                    {config.price === 0 ? (
                      <span className="font-heading text-4xl font-bold">Free</span>
                    ) : (
                      <>
                        <span className="font-heading text-4xl font-bold">
                          ${config.price}
                        </span>
                        <span className="text-muted-foreground text-sm">/mo</span>
                      </>
                    )}
                  </div>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {FEATURES.map((feature) => {
                    const value = feature.tiers[tier];
                    const isIncluded = value !== 'No' && value !== '—';

                    return (
                      <li key={feature.label} className="flex items-start gap-2 text-sm">
                        {isIncluded ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        ) : (
                          <X className="text-muted-foreground/40 mt-0.5 h-4 w-4 shrink-0" />
                        )}
                        <span
                          className={
                            isIncluded ? 'text-foreground' : 'text-muted-foreground/60'
                          }
                        >
                          {feature.label}
                          {isIncluded && value !== 'Yes' && (
                            <span className="text-muted-foreground ml-1 text-xs">
                              ({value})
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <Link
                  href="/sign-up"
                  className={`inline-flex h-11 items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none ${
                    isPopular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring shadow'
                      : 'border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring border shadow-sm'
                  }`}
                >
                  {config.price === 0 ? 'Start free' : 'Start 14-day trial'}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
