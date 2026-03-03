'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Map } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { StepPage } from '../_components/step-page';
import { useOnboardingState } from '../_components/use-onboarding-state';
import { TemplateBrowser } from '@/app/(dashboard)/_components/template-browser';

export default function ToursStepPage() {
  const router = useRouter();
  const { isLoading, status, invalidate } = useOnboardingState();

  if (isLoading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />;
  }

  return (
    <StepPage
      step={3}
      total={5}
      title="Add your first tour"
      description="Clone a shared template so your team can build and send proposals faster."
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-stone-200 p-2 text-stone-700">
              <Map className="h-4 w-4" />
            </div>
            <div>
              <div
                className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold ${
                  status?.steps.hasTours.complete ? 'bg-green-100 text-green-700' : 'bg-stone-200 text-stone-600'
                }`}
              >
                {status?.steps.hasTours.complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                {status?.steps.hasTours.complete ? 'Completed' : 'Pending'}
              </div>
              <h3 className="mt-3 text-base font-semibold text-stone-900">Tour templates</h3>
              <p className="mt-1 text-sm text-stone-600">
                Add at least one template to continue.
                {status?.steps.hasTours.current ? ` Current: ${status.steps.hasTours.current}.` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Link href="/onboarding/notification" className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div className="flex items-center gap-3">
            <TemplateBrowser
              onTemplateCloned={() => invalidate()}
              trigger={
                <Button variant="outline" className="gap-2">
                  <Map className="h-4 w-4" />
                  Browse templates
                </Button>
              }
            />

            <Button
              className="gap-2 bg-green-700 hover:bg-green-800"
              disabled={!status?.steps.hasTours.complete}
              onClick={() => router.push('/onboarding/plan')}
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </StepPage>
  );
}
