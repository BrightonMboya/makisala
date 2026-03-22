'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';
import { useState, useEffect, useCallback } from 'react';
import { checkout, customer } from '@/lib/auth-client';
import { toast } from '@repo/ui/toast';
import {
  CheckCircle,
  ExternalLink,
  Loader2,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { usePlan } from '@/components/plan-context';
import { PLAN_CONFIG, TIER_ORDER, type PlanTier } from '@/lib/plans-config';

const TIER_FEATURES: { label: string; tiers: Record<PlanTier, string> }[] = [
  {
    label: 'Active proposals',
    tiers: { free: '2', starter: '5', pro: 'Unlimited', business: 'Unlimited' },
  },
  {
    label: 'Content library',
    tiers: { free: 'Yes', starter: 'Yes', pro: 'Yes', business: 'Yes' },
  },
  {
    label: 'Own image uploads',
    tiers: { free: 'No', starter: 'No', pro: 'Yes', business: 'Yes' },
  },
  {
    label: 'Team members',
    tiers: { free: '0', starter: '0', pro: '3', business: 'Unlimited' },
  },
  {
    label: 'Themes',
    tiers: { free: 'Minimalistic', starter: 'Minimalistic', pro: 'All 4', business: 'All 4' },
  },
  {
    label: 'Watermark',
    tiers: { free: 'Yes', starter: 'Yes', pro: 'No', business: 'No' },
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

export function BillingSettings() {
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
  const [checkingOutSlug, setCheckingOutSlug] = useState<string | null>(null);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    currentPeriodEnd: string | Date | null;
    cancelAtPeriodEnd: boolean;
  } | null>(null);
  const searchParams = useSearchParams();
  const { plan, isLoading: isPlanLoading, refreshPlan, waitForPlanUpdate } = usePlan();

  const fetchCustomerState = useCallback(async () => {
    try {
      const { data } = await customer.state();
      const subscription = data?.activeSubscriptions?.[0];
      if (subscription) {
        setHasActiveSubscription(true);
        setSubscriptionInfo({
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        });
      }
    } catch (error) {
      // Server-side logging handled by API route
    } finally {
      setIsLoadingCustomer(false);
    }
  }, []);

  // Fetch customer state on mount
  useEffect(() => {
    fetchCustomerState();
  }, [fetchCustomerState]);

  // Handle checkout success redirect
  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      // Clear the query param first to prevent re-showing on remount
      window.history.replaceState({}, '', '/settings?tab=billing');
      toast({ title: 'Activating subscription...' });
      // Poll until the webhook updates the DB, then refresh
      waitForPlanUpdate()
        .then(() => {
          toast({ title: 'Subscription activated successfully!' });
        })
        .catch(() => {
          toast({ title: 'Failed to refresh plan status', variant: 'destructive' });
        });
      fetchCustomerState();
    }
    // Only run once on mount when checkout=success is present
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCheckout(slug: string) {
    setCheckingOutSlug(slug);
    try {
      await checkout({ slug });
    } catch (error) {
      toast({ title: 'Failed to start checkout', variant: 'destructive' });
      setCheckingOutSlug(null);
    }
  }

  async function handleManageSubscription() {
    setIsOpeningPortal(true);
    try {
      await customer.portal();
    } catch (error) {
      toast({ title: 'Failed to open billing portal', variant: 'destructive' });
      setIsOpeningPortal(false);
    }
  }

  const isLoading = isPlanLoading || isLoadingCustomer;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  const currentTier = plan?.effectiveTier ?? 'free';
  const actualTier = plan?.tier ?? 'free';

  return (
    <div className="space-y-6">
      {/* Trial Banner */}
      {plan?.isTrialing && plan.trialDaysRemaining !== null && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <Clock className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              Pro trial — {plan.trialDaysRemaining} day{plan.trialDaysRemaining !== 1 ? 's' : ''}{' '}
              remaining
            </p>
            <p className="text-xs text-blue-700">
              You have full Pro access during your trial. Subscribe to keep your features.
            </p>
          </div>
        </div>
      )}

      {/* Active Subscription Info */}
      {hasActiveSubscription && subscriptionInfo && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">
                    {PLAN_CONFIG[actualTier].name} Plan
                  </p>
                  <p className="text-sm text-green-700">
                    {subscriptionInfo.currentPeriodEnd
                      ? subscriptionInfo.cancelAtPeriodEnd
                        ? `Cancels on ${new Date(subscriptionInfo.currentPeriodEnd).toLocaleDateString()}`
                        : `Renews on ${new Date(subscriptionInfo.currentPeriodEnd).toLocaleDateString()}`
                      : 'Active subscription'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-600">
                  Active
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageSubscription}
                  disabled={isOpeningPortal}
                >
                  {isOpeningPortal ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Manage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Plans</CardTitle>
          <CardDescription>Choose the plan that best fits your agency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {TIER_ORDER.map((tier) => {
              const config = PLAN_CONFIG[tier];
              const isCurrent = tier === currentTier;
              const isActual = tier === actualTier;
              const tierIdx = TIER_ORDER.indexOf(tier);
              const currentIdx = TIER_ORDER.indexOf(actualTier);
              const isUpgrade = tierIdx > currentIdx;
              const isDowngrade = tierIdx < currentIdx;

              return (
                <div
                  key={tier}
                  className={`relative rounded-lg border p-4 ${
                    isCurrent
                      ? 'border-green-300 bg-green-50 ring-1 ring-green-200'
                      : 'border-stone-200'
                  }`}
                >
                  {isCurrent && (
                    <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-green-600 text-xs">
                      Current
                    </Badge>
                  )}

                  <div className="mb-4 pt-1 text-center">
                    <h3 className="text-lg font-semibold">{config.name}</h3>
                    <div className="mt-1">
                      {config.price === 0 ? (
                        <span className="text-2xl font-bold">Free</span>
                      ) : (
                        <>
                          <span className="text-2xl font-bold">${config.price}</span>
                          <span className="text-sm text-stone-500">/mo</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mb-4">
                    {tier === 'free' ? (
                      <Button variant="outline" size="sm" className="w-full" disabled>
                        {isActual ? 'Current plan' : 'Free'}
                      </Button>
                    ) : isActual ? (
                      <Button variant="outline" size="sm" className="w-full" disabled>
                        Current plan
                      </Button>
                    ) : isUpgrade ? (
                      <Button
                        size="sm"
                        className="w-full gap-1.5"
                        onClick={() => handleCheckout(tier)}
                        disabled={checkingOutSlug !== null}
                      >
                        {checkingOutSlug === tier ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        Upgrade
                      </Button>
                    ) : isDowngrade ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleManageSubscription}
                        disabled={isOpeningPortal}
                      >
                        Manage
                      </Button>
                    ) : null}
                  </div>

                  {/* Feature List */}
                  <ul className="space-y-2 text-xs">
                    {TIER_FEATURES.map((feature) => {
                      const value = feature.tiers[tier];
                      const isPositive =
                        value !== 'No' && value !== '0' && value !== 'Yes' && value !== 'Minimalistic';
                      const isNegative = value === 'No' || value === '0';
                      // "Watermark: Yes" is negative (user wants no watermark)
                      const isWatermarkYes =
                        feature.label === 'Watermark' && value === 'Yes';
                      const isWatermarkNo =
                        feature.label === 'Watermark' && value === 'No';

                      return (
                        <li key={feature.label} className="flex items-center gap-1.5">
                          {isWatermarkNo || (!isNegative && !isWatermarkYes) ? (
                            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-600" />
                          ) : (
                            <X className="h-3.5 w-3.5 shrink-0 text-stone-300" />
                          )}
                          <span
                            className={
                              isNegative || isWatermarkYes
                                ? 'text-stone-400'
                                : 'text-stone-700'
                            }
                          >
                            {feature.label}:{' '}
                            <span className="font-medium">{value}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Billing Portal */}
      {hasActiveSubscription && (
        <Card>
          <CardHeader>
            <CardTitle>Billing Portal</CardTitle>
            <CardDescription>
              Update payment method, view invoices, or cancel subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={isOpeningPortal}
            >
              {isOpeningPortal ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Open Billing Portal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
