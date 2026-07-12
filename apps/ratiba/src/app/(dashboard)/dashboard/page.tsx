import { createServerCaller } from '@/server/trpc/caller';
import { DashboardView } from './dashboard-view';
import { monthWindow } from './calendar-window';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const trpc = await createServerCaller();

  // Seed the calendar with the current month's window; the client refetches as
  // the user navigates. The initial state matches this so the prefetched data
  // hydrates without a refetch on first paint.
  const initialRange = monthWindow(new Date());
  const trips = await trpc.proposals.listForCalendar({ filter: 'all', ...initialRange });

  return <DashboardView initialTrips={trips} initialRange={initialRange} />;
}
