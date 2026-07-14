'use client';

import type { AppRouter } from '@/server/trpc/router';
import type { inferRouterOutputs } from '@trpc/server';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarView } from './calendar-view';
import { ProposalsList } from './proposals-list';
import { ViewSwitcher, type DashboardView as View } from './view-switcher';
import type { CalendarWindow } from './calendar-window';

type RouterOutputs = inferRouterOutputs<AppRouter>;

interface DashboardViewProps {
  initialClients: RouterOutputs['proposals']['listClientsForDashboard'];
  initialTrips: RouterOutputs['proposals']['listForCalendar'];
  initialRange: CalendarWindow;
}

export function DashboardView({
  initialClients,
  initialTrips,
  initialRange,
}: DashboardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The list is the default working surface; the calendar is opt-in via ?view.
  // Keeping it in the URL makes the toggle shareable and back-button friendly.
  const view: View = searchParams.get('view') === 'calendar' ? 'calendar' : 'list';

  const setView = (next: View) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'list') params.delete('view');
    else params.set('view', next);
    const query = params.toString();
    router.replace(query ? `/dashboard?${query}` : '/dashboard', { scroll: false });
  };

  const switcher = <ViewSwitcher view={view} onChange={setView} />;

  if (view === 'calendar') {
    return (
      <div className="flex h-full flex-col bg-stone-50">
        <div className="flex-1 overflow-auto p-6">
          <CalendarView
            initialTrips={initialTrips}
            initialRange={initialRange}
            leftSlot={switcher}
          />
        </div>
      </div>
    );
  }

  return <ProposalsList initialClients={initialClients} leftSlot={switcher} />;
}
