import { createServerCaller } from '@/server/trpc/caller';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
  const trpc = await createServerCaller();

  const [proposals, isAdmin] = await Promise.all([
    trpc.proposals.listForDashboard({ filter: 'mine' }),
    trpc.settings.checkAdmin(),
  ]);

  return <DashboardClient initialProposals={proposals} initialIsAdmin={isAdmin} />;
}
