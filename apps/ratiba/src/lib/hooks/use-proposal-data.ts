'use client';

import { staleTimes } from '@/lib/query-keys';
import { trpc } from '@/lib/trpc';

interface UseProposalDataOptions {
  proposalId: string;
  tourId?: string | null;
  isNewProposal: boolean;
}

/**
 * Hook to load proposal or tour template data for the builder
 * Uses React Query for caching and deduplication
 */
export function useProposalData({ proposalId, tourId, isNewProposal }: UseProposalDataOptions) {
  // Fetch existing proposal if we have an ID and it's not new
  const proposalQuery = trpc.proposals.getForBuilder.useQuery(
    { id: proposalId },
    {
      enabled: !isNewProposal && !!proposalId,
      staleTime: staleTimes.proposals,
      // A NOT_FOUND means the id belongs to another org (or doesn't exist);
      // that verdict is deterministic, so don't retry it into a slow spinner.
      retry: (failureCount, error) =>
        error.data?.code === 'NOT_FOUND' ? false : failureCount < 2,
    },
  );

  // Fetch tour template if no proposal found and we have a tourId
  const tourQuery = trpc.tours.getDetails.useQuery(
    { id: tourId! },
    {
      enabled: !!tourId && (isNewProposal || (!proposalQuery.data && !proposalQuery.isLoading)),
      staleTime: staleTimes.nationalParks,
    },
  );

  // Determine loading state
  const isLoading = proposalQuery.isLoading || (!!tourId && tourQuery.isLoading);

  // The requested proposal id resolves to a proposal owned by another org (or
  // to nothing at all). The builder should render a not-found fallback rather
  // than an empty theme.
  const notFound = proposalQuery.error?.data?.code === 'NOT_FOUND';

  return {
    proposal: proposalQuery.data,
    tourTemplate: tourQuery.data,
    isLoading,
    notFound,
    error: proposalQuery.error || tourQuery.error,
  };
}

/**
 * Hook to fetch client details with caching
 */
export function useClientData(clientId: string | null) {
  return trpc.clients.getById.useQuery(
    { id: clientId! },
    { enabled: !!clientId, staleTime: staleTimes.clients },
  );
}
