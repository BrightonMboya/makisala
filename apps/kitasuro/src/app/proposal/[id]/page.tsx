import React from 'react';
import { notFound } from 'next/navigation';
import MinimalisticTheme from '@/components/themes/MinimalisticTheme';
import SafariPortalTheme from '@/components/themes/SafariPortalTheme';
import { CommentsProvider } from '@/components/comments/CommentsProvider';
import { CommentsOverlay } from '@/components/comments/CommentsOverlay';
import { getProposal } from '@/app/new/actions';
import { transformProposalToItineraryData } from '@/lib/proposal-transform';

export default async function ItineraryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const proposal = await getProposal(id);

    if (!proposal) {
      notFound();
    }

    // Transform proposal data to ItineraryData format
    const transformedData = await transformProposalToItineraryData(proposal);

    if (!transformedData) {
      notFound();
    }

    return (
      <CommentsProvider proposalId={id}>
        <CommentsOverlay>
          {transformedData.theme === 'safari-portal' ? (
            <SafariPortalTheme data={transformedData} />
          ) : (
            <MinimalisticTheme data={transformedData} />
          )}
        </CommentsOverlay>
      </CommentsProvider>
    );
  } catch (err) {
    console.error('Error loading proposal:', err);
    notFound();
  }
}
