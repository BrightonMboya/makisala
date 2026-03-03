'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from '@repo/ui/toast';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import { StepPage } from '../_components/step-page';
import { useOnboardingState } from '../_components/use-onboarding-state';

export default function NotificationStepPage() {
  const router = useRouter();
  const updateOrgMutation = trpc.settings.updateOrg.useMutation();
  const { isLoading, isAdmin, onboardingData, setOnboardingData } =
    useOnboardingState();
  const [notificationEmail, setNotificationEmail] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Initialize form values once data is available
  if (!initialized && onboardingData) {
    setNotificationEmail(onboardingData.organization?.notificationEmail || '');
    setInitialized(true);
  }

  const onContinue = () => {
    if (!isAdmin) return;

    const value = notificationEmail.trim();
    if (!value) {
      toast({ title: 'Notification email is required', variant: 'destructive' });
      return;
    }

    if (!z.string().email().safeParse(value).success) {
      toast({ title: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }

    updateOrgMutation.mutate(
      { notificationEmail: value },
      {
        onSuccess: () => {
          setOnboardingData(undefined, (prev) =>
            prev
              ? {
                  ...prev,
                  organization: prev.organization
                    ? { ...prev.organization, notificationEmail: value }
                    : prev.organization,
                }
              : prev,
          );
          router.push('/onboarding/tours');
        },
        onError: (error) => {
          const message =
            error instanceof Error ? error.message : 'Failed to update notification email';
          toast({ title: message, variant: 'destructive' });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
    );
  }

  return (
    <StepPage
      step={2}
      total={5}
      title="Add notification email"
      description="Get client comments and proposal updates delivered to one inbox."
    >
      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-800">Notification email</span>
          <Input
            type="email"
            value={notificationEmail}
            onChange={(event) => setNotificationEmail(event.target.value)}
            placeholder="bookings@youragency.com"
            disabled={!isAdmin || updateOrgMutation.isPending}
          />
        </label>

        {!isAdmin && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Only admins can change notification settings. Ask an admin to complete this step.
          </p>
        )}

        <div className="flex items-center justify-between gap-4">
          <Link
            href="/onboarding/workspace"
            className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <Button
            onClick={onContinue}
            disabled={!isAdmin || updateOrgMutation.isPending}
            className="gap-2 bg-green-700 hover:bg-green-800"
          >
            {updateOrgMutation.isPending ? 'Saving...' : 'Continue'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </StepPage>
  );
}
