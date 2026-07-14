import { createServerCaller } from '@/server/trpc/caller';
import { DashboardView } from './dashboard-view';
import { monthWindow } from './calendar-window';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const trpc = await createServerCaller();

  // The list is the default view, so seed it (and admin state) for a flash-free
  // first paint. Also seed the current month's booked trips so switching to the
  // calendar hydrates without a refetch. The calendar client query must request
  // the same window + statuses for the seed to match.
  const initialRange = monthWindow(new Date());
  const [clients, trips] = await Promise.all([
    trpc.proposals.listClientsForDashboard({ filter: 'all', page: 1, pageSize: 20 }),
    trpc.proposals.listForCalendar({ filter: 'all', statuses: ['booked'], ...initialRange }),
  ]);

  return (
    <DashboardView
      initialClients={clients}
      initialTrips={trips}
      initialRange={initialRange}
    />
  );
}
