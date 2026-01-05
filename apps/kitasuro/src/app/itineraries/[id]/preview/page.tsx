'use client';

import { Button } from '@repo/ui/button';
import { Share2, Mail, Download, Palette, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useBuilder } from '@/components/itinerary-builder/builder-context';
import { format } from 'date-fns';
import MinimalisticTheme from '@/components/themes/MinimalisticTheme';
import KuduTheme from '@/components/themes/kudu';
import { saveProposal, sendProposalToClient, getAllNationalParks, getAllAccommodations } from '@/app/itineraries/actions';
import { getClientById } from '@/app/(dashboard)/clients/actions';
import { toast } from '@repo/ui/toast';
import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { transformBuilderToItineraryData } from '@/lib/builder-transform';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/dialog';
import { CloudinaryImagePicker } from '@/components/cloudinary-image-picker';
import type { ThemeType } from '@/types/itinerary-types';

const THEME_OPTIONS: { value: ThemeType; label: string; description: string }[] = [
  { value: 'minimalistic', label: 'Minimalistic', description: 'Clean, modern design with elegant typography' },
  { value: 'kudu', label: 'Kudu', description: 'Dark, immersive snap-scroll theme' },
];

export default function PreviewPage() {
  const {
    tourId,
    days,
    setDays,
    startDate,
    travelerGroups,
    tourType,
    pricingRows,
    extras,
    clientId,
    tourTitle,
    startCity,
    pickupPoint,
    transferIncluded,
    inclusions,
    exclusions,
    selectedTheme,
    setSelectedTheme,
    heroImage,
    setHeroImage,
  } = useBuilder();

  const router = useRouter();
  const urlParams = useParams();
  const proposalId = urlParams.id as string;
  const [isProposalSaved, setIsProposalSaved] = useState(false);
  const [isHeroPickerOpen, setIsHeroPickerOpen] = useState(false);
  const [dayPickerOpen, setDayPickerOpen] = useState<number | null>(null);

  // Listen for hero image picker event from themes
  useEffect(() => {
    const handleOpenPicker = () => setIsHeroPickerOpen(true);
    window.addEventListener('openHeroImagePicker', handleOpenPicker);
    return () => window.removeEventListener('openHeroImagePicker', handleOpenPicker);
  }, []);

  // Listen for day image picker event from themes
  useEffect(() => {
    const handleOpenDayPicker = (e: CustomEvent<{ dayNumber: number }>) => {
      setDayPickerOpen(e.detail.dayNumber);
    };
    window.addEventListener('openDayImagePicker', handleOpenDayPicker as EventListener);
    return () => window.removeEventListener('openDayImagePicker', handleOpenDayPicker as EventListener);
  }, []);

  // Fetch client info
  const { data: clientData } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientId ? getClientById(clientId) : null,
    enabled: !!clientId,
  });

  const clientName = clientData?.name || '';
  const clientEmail = clientData?.email || null;

  // Fetch national parks and accommodations for transform
  const { data: parksData } = useQuery({
    queryKey: ['nationalParks'],
    queryFn: getAllNationalParks,
  });

  const { data: accommodationsData } = useQuery({
    queryKey: ['accommodations'],
    queryFn: getAllAccommodations,
  });

  const nationalParksMap = useMemo(() => {
    const map: Record<string, { id: string; name: string }> = {};
    parksData?.forEach((p) => {
      map[p.id] = { id: p.id, name: p.name };
    });
    return map;
  }, [parksData]);

  const accommodationsMap = useMemo(() => {
    const map: Record<string, { id: string; name: string; image?: string; description?: string }> = {};
    accommodationsData?.forEach((a: any) => {
      map[a.id] = {
        id: a.id,
        name: a.name,
        description: a.overview || undefined,
        image: a.images?.[0]?.imageUrl || undefined,
      };
    });
    return map;
  }, [accommodationsData]);

  // Transform builder data to ItineraryData format
  const itineraryData = useMemo(() => {
    return transformBuilderToItineraryData({
      days,
      startDate,
      travelerGroups,
      pricingRows,
      extras,
      inclusions,
      exclusions,
      tourTitle,
      clientName,
      selectedTheme,
      heroImage,
      nationalParksMap,
      accommodationsMap,
    });
  }, [days, startDate, travelerGroups, pricingRows, extras, inclusions, exclusions, tourTitle, clientName, selectedTheme, heroImage, nationalParksMap, accommodationsMap]);

  // Share Proposal Mutation
  const shareProposalMutation = useMutation({
    mutationFn: async () => {
      if (!tourId) {
        throw new Error('Tour ID is required to save proposal.');
      }

      const proposalData = {
        days,
        startDate,
        travelerGroups,
        tourType,
        pricingRows,
        extras,
        clientId,
        tourTitle,
        startCity,
        pickupPoint,
        transferIncluded,
        inclusions,
        exclusions,
        selectedTheme,
        heroImage,
      };

      const result = await saveProposal({
        id: proposalId,
        name: tourTitle || 'Untitled Safari',
        data: proposalData,
        status: 'shared',
        tourId: tourId,
      });

      if (!result.success) {
        throw new Error('Failed to share proposal.');
      }

      return result;
    },
    onSuccess: async (result) => {
      const savedProposalId = (result as any).id || proposalId;
      const link = `${window.location.origin}/proposal/${savedProposalId}`;
      await navigator.clipboard.writeText(link);
      setIsProposalSaved(true);
      toast({
        title: 'Proposal Shared!',
        description: 'Link copied to clipboard.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to share proposal',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Send Email Mutation
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      if (!clientEmail) {
        throw new Error('Client does not have an email address.');
      }
      const result = await sendProposalToClient(proposalId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email.');
      }
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Email Sent!',
        description: `Proposal sent to ${clientName} at ${clientEmail}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send email',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Download PDF Mutation
  const downloadPDFMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/proposal/${proposalId}/pdf`);
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      return response.blob();
    },
    onSuccess: async (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tourTitle || 'proposal'}-${proposalId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'PDF Downloaded!',
        description: 'Your proposal PDF has been downloaded.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to download PDF',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleHeroImageSelect = (url: string) => {
    setHeroImage(url);
    toast({
      title: 'Hero Image Updated',
      description: 'The hero image has been updated.',
    });
  };

  const handleDayImageSelect = (dayNumber: number, url: string) => {
    setDays(prevDays =>
      prevDays.map(day =>
        day.dayNumber === dayNumber
          ? { ...day, previewImage: url }
          : day
      )
    );
    setDayPickerOpen(null);
    toast({
      title: `Day ${dayNumber} Image Updated`,
      description: 'The day preview image has been updated.',
    });
  };

  return (
    <div className="relative pb-24">
      {/* Hero Image Picker Dialog */}
      <Dialog open={isHeroPickerOpen} onOpenChange={setIsHeroPickerOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Hero Image</DialogTitle>
          </DialogHeader>
          <CloudinaryImagePicker
            value={heroImage}
            onSelect={(url) => {
              handleHeroImageSelect(url);
              setIsHeroPickerOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Day Image Picker Dialog */}
      <Dialog open={dayPickerOpen !== null} onOpenChange={(open) => !open && setDayPickerOpen(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Image for Day {dayPickerOpen}</DialogTitle>
          </DialogHeader>
          <CloudinaryImagePicker
            value={days.find(d => d.dayNumber === dayPickerOpen)?.previewImage || ''}
            onSelect={(url) => {
              if (dayPickerOpen !== null) {
                handleDayImageSelect(dayPickerOpen, url);
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Theme Preview */}
      {selectedTheme === 'kudu' ? (
        <KuduTheme
          data={itineraryData}
          onHeroImageChange={handleHeroImageSelect}
          onDayImageChange={handleDayImageSelect}
        />
      ) : (
        <MinimalisticTheme data={itineraryData} onHeroImageChange={handleHeroImageSelect} />
      )}

      {/* Floating Action Bar */}
      <div className="fixed right-0 bottom-0 left-0 z-50 border-t bg-white p-4 shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Proposal generated on {format(new Date(), 'MMMM d, yyyy')}
            </div>

            {/* Theme Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Palette className="h-4 w-4" />
                  Theme: {THEME_OPTIONS.find(t => t.value === selectedTheme)?.label}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="start">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Select Theme</h4>
                  <div className="space-y-2">
                    {THEME_OPTIONS.map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => setSelectedTheme(theme.value)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedTheme === theme.value
                            ? 'border-green-600 bg-green-50'
                            : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        <div className="font-medium text-sm">{theme.label}</div>
                        <div className="text-xs text-stone-500">{theme.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              Edit Itinerary
            </Button>

            {isProposalSaved && (
              <>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => downloadPDFMutation.mutate()}
                  disabled={downloadPDFMutation.isPending}
                >
                  {downloadPDFMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {downloadPDFMutation.isPending ? 'Generating...' : 'Download PDF'}
                </Button>

                {clientId && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => sendEmailMutation.mutate()}
                    disabled={sendEmailMutation.isPending}
                  >
                    {sendEmailMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                    {sendEmailMutation.isPending ? 'Sending...' : 'Send to Client'}
                  </Button>
                )}
              </>
            )}

            <Link href={`/itineraries/${proposalId}/share`}>
              <Button className="gap-2 bg-green-600 hover:bg-green-700">
                Publish & Send
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
