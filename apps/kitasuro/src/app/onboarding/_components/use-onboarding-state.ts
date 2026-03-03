'use client';

import { checkOnboardingStatus, getNextStep } from '@/lib/onboarding';
import { trpc } from '@/lib/trpc';
import { useSession } from '@/components/session-context';

export function useOnboardingState() {
  const utils = trpc.useUtils();
  const { session } = useSession();
  const userId = session?.user?.id;

  const { data: isAdmin = false, isLoading: isAdminLoading } = trpc.settings.checkAdmin.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
    refetchOnMount: false,
  });

  const { data, isLoading: isDataLoading } = trpc.onboarding.getData.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
    refetchOnMount: false,
  });

  const isLoading = !userId || (isDataLoading && !data) || (isAdminLoading && !isAdmin);

  const status = data ? checkOnboardingStatus(data.organization, data.tourCount) : null;
  const orgOnboardingComplete = !!data?.organization?.onboardingCompletedAt;

  const nextStep = getNextStep({
    isComplete: status?.isComplete,
    organizationNameComplete: status?.steps.organizationName.complete,
    notificationEmailComplete: status?.steps.notificationEmail.complete,
    hasToursComplete: status?.steps.hasTours.complete,
  });

  return {
    isLoading,
    isAdmin,
    status,
    onboardingData: data,
    orgOnboardingComplete,
    nextStep,
    invalidate: () => utils.onboarding.getData.invalidate(),
    setOnboardingData: utils.onboarding.getData.setData,
  };
}
