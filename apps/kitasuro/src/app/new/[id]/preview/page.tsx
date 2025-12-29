'use client';

import { Button } from '@repo/ui/button';
import { Share2 } from 'lucide-react';
import { useBuilder } from '@/components/itinerary-builder/builder-context';
import { format } from 'date-fns';
import { ItineraryPreview } from '@/components/itinerary-builder/itinerary-preview';
import { saveProposal } from '@/app/new/actions';
import { useToast } from '@/lib/hooks/use-toast';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PreviewPage({ params }: { params: { id: string } }) {
  const {
    days,
    startDate,
    travelerGroups,
    tourType,
    pricingRows,
    extras,
    clientName,
    tourTitle,
    startCity,
    pickupPoint,
    transferIncluded,
    inclusions,
    exclusions,
  } = useBuilder();

  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tourId = searchParams.get('tourId');
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      // Prepare data object to save
      const proposalData = {
        days,
        startDate,
        travelerGroups,
        tourType,
        pricingRows,
        extras,
        clientName,
        tourTitle,
        startCity,
        pickupPoint,
        transferIncluded,
        inclusions,
        exclusions,
      };

      if (!tourId) {
        toast('Error', {
          description: 'Tour ID is required to save proposal.',
          variant: 'destructive',
        });
        return;
      }

      const result = await saveProposal({
        id: params.id, // Using the builder ID as the proposal ID
        name: tourTitle || 'Untitled Safari',
        data: proposalData,
        status: 'shared',
        tourId: tourId,
      });

      if (result.success) {
        // Use the returned ID if a new one was generated
        const proposalId = (result as any).id || params.id;
        const link = `${window.location.origin}/proposal/${proposalId}`;
        await navigator.clipboard.writeText(link);
        toast('Proposal Shared', {
          description: 'Link copied to clipboard. Redirecting...',
        });
        // Navigate to the proposal page after a short delay
        setTimeout(() => {
          router.push(`/proposal/${proposalId}`);
        }, 1000);
      } else {
        toast('Error', {
          description: 'Failed to share proposal.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error(error);
      toast('Error', {
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="relative">
      <ItineraryPreview
        days={days}
        startDate={startDate}
        travelerGroups={travelerGroups}
        tourType={tourType}
        pricingRows={pricingRows}
        extras={extras}
        clientName={clientName}
        tourTitle={tourTitle}
        inclusions={inclusions}
        exclusions={exclusions}
        isPublic={false}
      />

      {/* Floating Action Bar Override for CMS Context */}
      <div className="fixed right-0 bottom-0 left-0 z-50 border-t bg-white p-4 shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="text-sm text-gray-500">
            Proposal generated on {format(new Date(), 'MMMM d, yyyy')}
          </div>
          <div className="flex gap-4">
            <Button variant="outline">Edit Itinerary</Button>
            <Button
              className="gap-2 bg-green-600 hover:bg-green-700"
              onClick={handleShare}
              disabled={isSharing}
            >
              <Share2 className="h-4 w-4" />
              {isSharing ? 'Saving...' : 'Share Proposal'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
