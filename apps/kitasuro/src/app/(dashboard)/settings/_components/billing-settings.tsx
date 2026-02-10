'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';
import { useState, useEffect } from 'react';
import { checkout, customer } from '@/lib/auth-client';
import { toast } from '@repo/ui/toast';
import { CreditCard, ExternalLink, CheckCircle, Loader2, Gift } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface ActiveSubscription {
  id: string;
  status: string;
  currentPeriodEnd: string | Date | null;
  cancelAtPeriodEnd: boolean;
  productId: string;
}

interface Benefit {
  id: string;
  type: string;
  description: string;
  properties?: Record<string, unknown>;
}

export function BillingSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Show success toast if coming from checkout
    if (searchParams.get('checkout') === 'success') {
      toast({ title: 'Subscription activated successfully!' });
      // Clean up the URL
      window.history.replaceState({}, '', '/settings?tab=billing');
    }

    fetchCustomerState();
  }, [searchParams]);

  async function fetchCustomerState() {
    try {
      const { data } = await customer.state();
      // Find active subscription from the customer state
      const subscription = data?.activeSubscriptions?.[0];
      if (subscription) {
        setActiveSubscription({
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          productId: subscription.productId,
        });

        // Fetch benefits for subscribed users
        await fetchBenefits();
      }
    } catch (error) {
      console.error('Failed to fetch customer state:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchBenefits() {
    try {
      const { data } = await customer.benefits.list({ query: { limit: 50 } });
      if (data?.items) {
        setBenefits(
          data.items.map((item: { benefit: { id: string; type: string; description: string; properties?: Record<string, unknown> } }) => ({
            id: item.benefit.id,
            type: item.benefit.type,
            description: item.benefit.description,
            properties: item.benefit.properties,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to fetch benefits:', error);
    }
  }

  async function handleUpgrade() {
    setIsCheckingOut(true);
    try {
      await checkout({ slug: 'pro' });
    } catch (error) {
      console.error('Checkout failed:', error);
      toast({ title: 'Failed to start checkout', variant: 'destructive' });
      setIsCheckingOut(false);
    }
  }

  async function handleManageSubscription() {
    setIsOpeningPortal(true);
    try {
      await customer.portal();
    } catch (error) {
      console.error('Failed to open portal:', error);
      toast({ title: 'Failed to open billing portal', variant: 'destructive' });
      setIsOpeningPortal(false);
    }
  }

  const hasActiveSubscription = !!activeSubscription;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Manage your subscription and billing</CardDescription>
        </CardHeader>
        <CardContent>
          {hasActiveSubscription && activeSubscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">Pro Plan</p>
                    <p className="text-sm text-green-700">
                      {activeSubscription.currentPeriodEnd
                        ? activeSubscription.cancelAtPeriodEnd
                          ? `Cancels on ${new Date(activeSubscription.currentPeriodEnd).toLocaleDateString()}`
                          : `Renews on ${new Date(activeSubscription.currentPeriodEnd).toLocaleDateString()}`
                        : 'Active subscription'}
                    </p>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-600">
                  Active
                </Badge>
              </div>

              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={isOpeningPortal}
                className="w-full sm:w-auto"
              >
                {isOpeningPortal ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Manage Subscription
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg border">
                <p className="font-medium text-gray-900">Free Plan</p>
                <p className="text-sm text-gray-600 mt-1">
                  You&apos;re currently on the free plan with limited features.
                </p>
              </div>

              {/* Pro Plan Card */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Pro Plan</h3>
                    <p className="text-gray-600">Unlock all features</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">$30</p>
                    <p className="text-sm text-gray-500">/month</p>
                  </div>
                </div>

                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Unlimited itineraries
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Unlimited team members
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Custom branding
                  </li>
                </ul>

                <Button
                  onClick={handleUpgrade}
                  disabled={isCheckingOut}
                  className="w-full"
                  size="lg"
                >
                  {isCheckingOut ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Upgrade to Pro
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Benefits */}
      {hasActiveSubscription && benefits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Your Benefits
            </CardTitle>
            <CardDescription>
              Benefits included with your Pro subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {benefits.map((benefit) => (
                <li
                  key={benefit.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {benefit.type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-gray-600">{benefit.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Billing Portal Access */}
      {hasActiveSubscription && (
        <Card>
          <CardHeader>
            <CardTitle>Billing Portal</CardTitle>
            <CardDescription>
              Update payment method, view invoices, or cancel subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Access the customer portal to manage all aspects of your billing, including:
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside mb-4 space-y-1">
              <li>Update payment method</li>
              <li>View and download invoices</li>
              <li>Change or cancel subscription</li>
              <li>Update billing information</li>
            </ul>
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
