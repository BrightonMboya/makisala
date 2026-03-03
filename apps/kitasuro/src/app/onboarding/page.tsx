import { redirect } from 'next/navigation';
import { createServerCaller } from '@/server/trpc/caller';
import { checkOnboardingStatus, getNextStep } from '@/lib/onboarding';

export default async function OnboardingIndexPage() {
  const trpc = await createServerCaller();
  const data = await trpc.onboarding.getData();

  const status = checkOnboardingStatus(data.organization, data.tourCount);

  const nextStep = getNextStep({
    isComplete: status.isComplete,
    organizationNameComplete: status.steps.organizationName.complete,
    notificationEmailComplete: status.steps.notificationEmail.complete,
    hasToursComplete: status.steps.hasTours.complete,
  });

  redirect(`/onboarding/${nextStep}`);
}
