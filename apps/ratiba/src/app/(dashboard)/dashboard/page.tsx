import { createServerCaller } from '@/server/trpc/caller';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { DashboardView } from './dashboard-view';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/sign-in');
  }

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
