import { createServerCaller } from '@/server/trpc/caller';
import { DashboardView } from './dashboard-view';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const trpc = await createServerCaller();

  const trips = await trpc.proposals.listForCalendar({ filter: 'all' });

  return <DashboardView initialTrips={trips} />;
}
