'use client';

import { Button } from '@repo/ui/button';
import { Lock, Sparkles } from 'lucide-react';
import { checkout } from '@/lib/auth-client';
import { useState } from 'react';
import type { PlanTier } from '@/lib/plans-config';
import { PLAN_CONFIG } from '@/lib/plans-config';

interface UpgradePromptProps {
  feature: string;
  reason?: string;
  upgradeToTier?: PlanTier;
  variant?: 'banner' | 'inline';
}

export function UpgradePrompt({
  feature,
  reason,
  upgradeToTier = 'pro',
  variant = 'inline',
}: UpgradePromptProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const tierConfig = PLAN_CONFIG[upgradeToTier];

  const handleUpgrade = async () => {
    setIsCheckingOut(true);
    try {
      await checkout({ slug: upgradeToTier });
    } catch (error) {
      console.error('Checkout failed:', error);
      setIsCheckingOut(false);
    }
  };

  if (variant === 'banner') {
    return (
      <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <Lock className="h-4 w-4 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              {reason || `${feature} requires an upgrade`}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleUpgrade}
          disabled={isCheckingOut}
          className="gap-1.5 bg-amber-600 hover:bg-amber-700"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Upgrade to {tierConfig.name}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-stone-200 bg-stone-50 p-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
        <Lock className="h-6 w-6 text-stone-400" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-stone-900">{feature}</h3>
      <p className="mb-4 max-w-sm text-sm text-stone-500">
        {reason || `This feature is available on the ${tierConfig.name} plan and above.`}
      </p>
      <Button onClick={handleUpgrade} disabled={isCheckingOut} className="gap-1.5">
        <Sparkles className="h-4 w-4" />
        Upgrade to {tierConfig.name} — ${tierConfig.price}/mo
      </Button>
    </div>
  );
}
