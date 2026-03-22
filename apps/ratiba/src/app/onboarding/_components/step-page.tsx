'use client';

import type { ReactNode } from 'react';
import { Building2, Bell, Map, CreditCard, PartyPopper } from 'lucide-react';

const STEPS = [
  { label: 'Workspace', icon: Building2 },
  { label: 'Email', icon: Bell },
  { label: 'Tours', icon: Map },
  { label: 'Plan', icon: CreditCard },
  { label: 'Done', icon: PartyPopper },
];

export function StepPage({
  title,
  description,
  step,
  total,
  children,
  className,
}: {
  title: ReactNode;
  description: ReactNode;
  step: number;
  total: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full ${className ?? 'max-w-xl'}`}>
      {/* Step indicator */}
      <nav className="mb-8 flex items-center justify-center" aria-label="Onboarding progress">
        {STEPS.map((s, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < step;
          const isCurrent = stepNum === step;
          const Icon = s.icon;

          return (
            <div key={s.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-700 text-white shadow-sm'
                      : isCurrent
                        ? 'bg-white text-green-800 shadow-md ring-2 ring-green-700'
                        : 'bg-white/60 text-stone-400 ring-1 ring-stone-200'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={`text-[0.625rem] font-medium tracking-wide ${
                    isCompleted
                      ? 'text-green-700'
                      : isCurrent
                        ? 'text-stone-800'
                        : 'text-stone-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-2 mb-5 h-px w-8 sm:w-12 ${
                    stepNum < step ? 'bg-green-700' : 'bg-stone-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </nav>

      {/* Card */}
      <div className="animate-in fade-in slide-in-from-bottom-3 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-lg shadow-stone-200/50 duration-400 sm:p-8">
        <h1 className="font-serif text-3xl font-bold text-stone-900">{title}</h1>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-stone-500">{description}</p>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
