'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { StepPage } from '../_components/step-page';
import { useOnboardingState } from '../_components/use-onboarding-state';
import { trpc } from '@/lib/trpc';

const COMPLETED_ITEMS = [
  'Agency workspace configured',
  'Notification email connected',
  'Tour templates added',
];

export default function SuccessStepPage() {
  const router = useRouter();
  const markCompleteMutation = trpc.onboarding.markComplete.useMutation();
  const { isLoading, invalidate } = useOnboardingState();

  const finish = async () => {
    await markCompleteMutation.mutateAsync();
    await invalidate();
    router.push('/dashboard');
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <StepPage
      step={5}
      total={5}
      title="You're all set!"
      description="Your workspace is configured and ready to go. Start creating proposals for your clients."
    >
      <div className="space-y-6">
        {/* Celebration banner */}
        <div className="relative overflow-hidden rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-green-200/30 blur-2xl" />
          <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-emerald-200/30 blur-2xl" />

          <div className="relative">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-700 shadow-sm">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-base font-semibold text-green-900">Setup complete</h3>
            <ul className="mt-3 space-y-2.5">
              {COMPLETED_ITEMS.map((item, i) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-sm text-green-800"
                  style={{ animationDelay: `${(i + 1) * 150}ms` }}
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-700/10">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-700" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Button
          className="w-full gap-2 bg-green-700 text-base hover:bg-green-800"
          size="lg"
          onClick={finish}
          disabled={markCompleteMutation.isPending}
        >
          {markCompleteMutation.isPending ? 'Finishing...' : 'Go to dashboard'}
          {!markCompleteMutation.isPending && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </StepPage>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <div className="h-6 w-32 animate-pulse rounded-lg bg-stone-200" />
      <div className="h-64 animate-pulse rounded-2xl bg-stone-100" />
    </div>
  );
}
