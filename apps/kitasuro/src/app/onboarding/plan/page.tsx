'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ONBOARDING_STEPS } from '@/lib/onboarding';
import { StepPage } from '../_components/step-page';
import { PlanSelector } from './plan-selector';

export default function PlanStepPage() {
  const router = useRouter();

  return (
    <StepPage
      step={ONBOARDING_STEPS.indexOf('plan') + 1}
      total={ONBOARDING_STEPS.length}
      title="Choose your plan"
      description="Find a plan that fits your agency, or start on the free plan."
      className="max-w-4xl"
    >
      <PlanSelector />
      <div className="mx-auto mt-6 flex flex-col items-center gap-4 text-sm">
        <button
          type="button"
          onClick={() => router.push('/onboarding/success')}
          className="text-stone-500 underline-offset-4 transition-colors hover:text-stone-800 hover:underline"
        >
          Start for free, pick a plan later
        </button>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <Link
          href="/onboarding/tours"
          className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>
    </StepPage>
  );
}
