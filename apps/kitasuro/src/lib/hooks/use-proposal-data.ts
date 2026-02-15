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
    { enabled: !isNewProposal && !!proposalId, staleTime: staleTimes.proposals },
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

  return {
    proposal: proposalQuery.data,
    tourTemplate: tourQuery.data,
    isLoading,
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
