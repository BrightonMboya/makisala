'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { StepPage } from '../_components/step-page';
import { useOnboardingState } from '../_components/use-onboarding-state';
import { trpc } from '@/lib/trpc';

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
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />;
  }

  return (
    <StepPage
      step={5}
      total={5}
      title="Your workspace is ready"
      description="You have completed onboarding and can now move to your dashboard."
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <h3 className="text-sm font-semibold text-green-900">Completed setup</h3>
          <ul className="mt-3 space-y-2 text-sm text-green-800">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Agency name
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Notification email
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              At least one tour template
            </li>
          </ul>
        </div>

        <Button
          className="w-full gap-2 bg-green-700 hover:bg-green-800"
          onClick={finish}
          disabled={markCompleteMutation.isPending}
        >
          {markCompleteMutation.isPending ? 'Finishing...' : 'Go to dashboard'}
        </Button>
      </div>
    </StepPage>
  );
}
