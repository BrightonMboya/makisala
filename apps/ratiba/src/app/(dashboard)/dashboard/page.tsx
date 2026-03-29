import { createServerCaller } from '@/server/trpc/caller';
import { DashboardView } from './dashboard-view';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const trpc = await createServerCaller();

  const [proposals, isAdmin] = await Promise.all([
    trpc.proposals.listForDashboard({ filter: 'mine', page: 1, pageSize: 20 }),
    trpc.settings.checkAdmin(),
  ]);

  return (
    <DashboardView
      initialProposals={proposals}
      initialIsAdmin={isAdmin}
    />
  );
}
