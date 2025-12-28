'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MinimalisticTheme from '@/components/themes/MinimalisticTheme';
import SafariPortalTheme from '@/components/themes/SafariPortalTheme';
import { CommentsProvider } from '@/components/comments/CommentsProvider';
import { CommentsOverlay } from '@/components/comments/CommentsOverlay';
import { getProposal } from '@/app/new/actions';
import { transformProposalToItineraryData } from '@/lib/proposal-transform';
import type { ItineraryData } from '@/data/itineraries';

export default function ItineraryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<ItineraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        setLoading(true);
        const proposal = await getProposal(id);

        if (!proposal) {
          setError('Proposal not found');
          setLoading(false);
          return;
        }

        // Transform proposal data to ItineraryData format
        const transformedData = transformProposalToItineraryData(
          proposal.id,
          proposal.data,
          proposal.name,
        );

        setData(transformedData);
      } catch (err) {
        console.error('Error fetching proposal:', err);
        setError('Failed to load proposal');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProposal();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFCFB]">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="text-stone-500">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFCFB]">
        <div className="space-y-4 text-center">
          <h1 className="font-serif text-4xl">Itinerary not found</h1>
          <p className="text-stone-500">{error || 'The requested proposal could not be found.'}</p>
          <button
            onClick={() => router.push('/new')}
            className="text-xs tracking-widest text-stone-500 uppercase transition-colors hover:text-stone-800"
          >
            Go back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <CommentsProvider proposalId={id}>
      <CommentsOverlay>
        {data.theme === 'safari-portal' ? (
          <SafariPortalTheme data={data} />
        ) : (
          <MinimalisticTheme data={data} />
        )}
      </CommentsOverlay>
    </CommentsProvider>
  );
}
