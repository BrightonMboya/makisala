'use client';

import type { AppRouter } from '@/server/trpc/router';
import type { inferRouterOutputs } from '@trpc/server';
import { CalendarView } from './calendar-view';

type RouterOutputs = inferRouterOutputs<AppRouter>;

interface DashboardViewProps {
  initialTrips: RouterOutputs['proposals']['listForCalendar'];
}

export function DashboardView({ initialTrips }: DashboardViewProps) {
  return (
    <div className="flex h-full flex-col bg-stone-50">
      <div className="flex-1 overflow-auto p-6">
        <CalendarView initialTrips={initialTrips} />
      </div>
    </div>
  );
}
