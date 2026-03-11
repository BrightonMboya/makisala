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

  const [proposals, isAdmin, onboardingData] = await Promise.all([
    trpc.proposals.listForDashboard({ filter: 'mine' }),
    trpc.settings.checkAdmin(),
    trpc.onboarding.getData(),
  ]);

  return (
    <DashboardView
      initialProposals={proposals}
      initialIsAdmin={isAdmin}
      initialOnboardingData={onboardingData}
    />
  );
}
