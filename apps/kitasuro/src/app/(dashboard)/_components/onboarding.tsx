'use client';

import { Button } from '@repo/ui/button';
import { CheckCircle2, Circle, Building2, Mail, Map, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { OnboardingStatus } from '@/lib/onboarding';
import { TemplateBrowser } from './template-browser';

interface OnboardingProps {
  status: OnboardingStatus;
  organizationName?: string | null;
  onToursUpdated?: () => void;
}

interface StepCardProps {
  title: string;
  description: string;
  complete: boolean;
  current: string | null;
  href: string;
  buttonLabel: string;
  icon: React.ReactNode;
}

function StepCard({ title, description, complete, current, href, buttonLabel, icon }: StepCardProps) {
  return (
    <div
      className={`rounded-xl border p-6 transition-all ${
        complete
          ? 'border-green-200 bg-green-50/50'
          : 'border-stone-200 bg-white hover:border-green-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            complete ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
          }`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-stone-900">{title}</h3>
            {complete ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-stone-300" />
            )}
          </div>
          <p className="mt-1 text-sm text-stone-500">{description}</p>
          {current && (
            <p className="mt-2 text-sm font-medium text-stone-700">
              Current: <span className="text-green-700">{current}</span>
            </p>
          )}
          {!complete && (
            <Link href={href} className="mt-4 inline-block">
              <Button size="sm" className="gap-2 bg-green-700 hover:bg-green-800">
                {buttonLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function Onboarding({ status, organizationName, onToursUpdated }: OnboardingProps) {
  const { steps, completedCount, totalSteps } = status;

  return (
    <div className="flex h-full flex-col bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-8 py-4">
        <h2 className="font-serif text-2xl font-bold text-stone-900">
          {organizationName ? `Welcome, ${organizationName}` : 'Welcome! Let\'s get started'}
        </h2>
      </header>

      <div className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-2xl">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-stone-700">Getting Started</span>
              <span className="text-stone-500">
                {completedCount} of {totalSteps} complete
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full bg-green-600 transition-all duration-500"
                style={{ width: `${(completedCount / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Introduction text */}
          <div className="mb-8 rounded-xl border border-stone-200 bg-white p-6">
            <p className="text-stone-600">
              Complete these steps to set up your agency and start creating beautiful travel proposals
              for your clients.
            </p>
          </div>

          {/* Onboarding steps */}
          <div className="space-y-4">
            <StepCard
              title="Set up your agency name"
              description="Give your agency a professional name that will appear on proposals sent to clients."
              complete={steps.organizationName.complete}
              current={steps.organizationName.current}
              href="/settings"
              buttonLabel="Go to Settings"
              icon={<Building2 className="h-5 w-5" />}
            />

            <StepCard
              title="Add notification email"
              description="Receive email notifications when clients comment on or accept proposals."
              complete={steps.notificationEmail.complete}
              current={steps.notificationEmail.current}
              href="/settings?tab=notifications"
              buttonLabel="Configure Notifications"
              icon={<Mail className="h-5 w-5" />}
            />

            {/* Tours step - special handling with TemplateBrowser */}
            <div
              className={`rounded-xl border p-6 transition-all ${
                steps.hasTours.complete
                  ? 'border-green-200 bg-green-50/50'
                  : 'border-stone-200 bg-white hover:border-green-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    steps.hasTours.complete ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  <Map className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-stone-900">Access tour templates</h3>
                    {steps.hasTours.complete ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-stone-300" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-stone-500">
                    You need tour templates to create proposals. Browse available templates or create your own.
                  </p>
                  {steps.hasTours.current && (
                    <p className="mt-2 text-sm font-medium text-stone-700">
                      Current: <span className="text-green-700">{steps.hasTours.current}</span>
                    </p>
                  )}
                  {!steps.hasTours.complete && (
                    <TemplateBrowser
                      onTemplateCloned={onToursUpdated}
                      trigger={
                        <Button size="sm" className="mt-4 gap-2 bg-green-700 hover:bg-green-800">
                          Browse Templates
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Help text */}
          <div className="mt-8 text-center text-sm text-stone-500">
            Need help? Contact us at{' '}
            <a href="mailto:support@makisala.com" className="text-green-700 hover:underline">
              support@makisala.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
