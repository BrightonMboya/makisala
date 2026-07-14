'use client';

import { CalendarDays, List } from 'lucide-react';

export type DashboardView = 'list' | 'calendar';

/**
 * Segmented control that flips the dashboard between the proposals list (the
 * working surface) and the booked-trips calendar. Rendered inside each view's
 * own toolbar so there's a single row of controls rather than two stacked bars.
 */
export function ViewSwitcher({
  view,
  onChange,
}: {
  view: DashboardView;
  onChange: (view: DashboardView) => void;
}) {
  return (
    <div className="flex rounded-lg border border-stone-200 bg-stone-50 p-0.5">
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors ${
          view === 'list'
            ? 'bg-white text-stone-900 shadow-sm'
            : 'text-stone-500 hover:text-stone-700'
        }`}
      >
        <List className="h-3.5 w-3.5" />
        List
      </button>
      <button
        type="button"
        onClick={() => onChange('calendar')}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors ${
          view === 'calendar'
            ? 'bg-white text-stone-900 shadow-sm'
            : 'text-stone-500 hover:text-stone-700'
        }`}
      >
        <CalendarDays className="h-3.5 w-3.5" />
        Calendar
      </button>
    </div>
  );
}
