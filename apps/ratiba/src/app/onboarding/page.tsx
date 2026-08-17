import { redirect } from 'next/navigation';
import { createServerCaller } from '@/server/trpc/caller';
import { checkOnboardingStatus, getNextStep } from '@/lib/onboarding';

export default async function OnboardingIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;

  // Invited users land here straight from the email-verification link. Hand off
  // to the invite page, which already handles session/email matching, accepting
  // the invitation, and setting the active organization before redirecting.
  if (invite) {
    redirect(`/invite/${invite}`);
  }

  const trpc = await createServerCaller();
  const data = await trpc.onboarding.getData().catch(() => null);

  if (!data) {
    redirect('/onboarding/workspace');
  }

  const status = checkOnboardingStatus(data.organization, data.tourCount);

  const nextStep = getNextStep({
    isComplete: status.isComplete,
    organizationNameComplete: status.steps.organizationName.complete,
    notificationEmailComplete: status.steps.notificationEmail.complete,
    hasToursComplete: status.steps.hasTours.complete,
  });

  redirect(`/onboarding/${nextStep}`);
}
