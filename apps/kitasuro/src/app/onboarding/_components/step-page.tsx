import type { ReactNode } from 'react';

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
  const progress = Math.max(0, Math.min(100, (step / total) * 100));

  return (
    <div className={`mx-auto w-full rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8 ${className ?? 'max-w-xl'}`}>
      <div className="mb-4 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-stone-500">
        <span>
          Step {step} of {total}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>

      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-stone-200">
        <div className="h-full rounded-full bg-green-700 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <h1 className="font-serif text-3xl font-bold text-stone-900">{title}</h1>
      <p className="mt-2 text-sm text-stone-600">{description}</p>

      <div className="mt-8">{children}</div>
    </div>
  );
}
