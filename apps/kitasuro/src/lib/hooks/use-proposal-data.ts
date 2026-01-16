'use client';

import { useQuery } from '@tanstack/react-query';
import { getProposalForBuilder, getTourDetails } from '@/app/itineraries/actions';
import { getClientById } from '@/app/(dashboard)/clients/actions';
import { queryKeys, staleTimes } from '@/lib/query-keys';

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
  const proposalQuery = useQuery({
    queryKey: queryKeys.proposals.forBuilder(proposalId),
    queryFn: () => getProposalForBuilder(proposalId),
    enabled: !isNewProposal && !!proposalId,
    staleTime: staleTimes.proposals,
  });

  // Fetch tour template if no proposal found and we have a tourId
  const tourQuery = useQuery({
    queryKey: queryKeys.tours.detail(tourId || ''),
    queryFn: () => getTourDetails(tourId!),
    enabled: !!tourId && (isNewProposal || (!proposalQuery.data && !proposalQuery.isLoading)),
    staleTime: staleTimes.nationalParks,
  });

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
  return useQuery({
    queryKey: queryKeys.clients.detail(clientId || ''),
    queryFn: () => getClientById(clientId!),
    enabled: !!clientId,
    staleTime: staleTimes.clients,
  });
}
