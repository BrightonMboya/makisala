'use client';

import { Button } from '@repo/ui/button';
import { ArrowRight, Loader2, Mail, Palette } from 'lucide-react';
import Link from 'next/link';
import { useBuilder } from '@/components/itinerary-builder/builder-context';
import { format } from 'date-fns';
import MinimalisticTheme from '@/components/themes/MinimalisticTheme';
import KuduTheme from '@/components/themes/kudu';
import DiscoveryTheme from '@/components/themes/DiscoveryTheme';
import { trpc } from '@/lib/trpc';
import { toast } from '@repo/ui/toast';
import { useEffect, useMemo, useState } from 'react';
import { toLocalISOString } from '@/lib/date-utils';
import { useParams, useRouter } from 'next/navigation';
import { transformBuilderToItineraryData } from '@/lib/builder-transform';
import { useMutation } from '@tanstack/react-query';
import { staleTimes } from '@/lib/query-keys';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog';
import { ImagePickerContent } from '@/components/image-picker';
import type { ThemeType } from '@/types/itinerary-types';
import { usePlan } from '@/components/plan-context';
import { ALLOWED_THEMES_BY_TIER } from '@/lib/plans-config';
import { Lock } from 'lucide-react';
import { EmailDeliveryStatus } from '@/components/email-delivery-status';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// R2 folder that holds each national park's images, keyed by park id.
const NATIONAL_PARKS_FOLDER = 'national-parks';

const THEME_OPTIONS: { value: ThemeType; label: string; description: string }[] = [
  {
    value: 'minimalistic',
    label: 'Minimalistic',
    description: 'Clean, modern design with elegant typography',
  },
  { value: 'kudu', label: 'Kudu', description: 'Dark, immersive snap-scroll theme' },
  {
    value: 'discovery',
    label: 'Discovery',
    description: 'Immersive split-screen layout with full-size images',
  },
];

export default function PreviewPage() {
  const {
    tourId,
    days,
    setDays,
    startDate,
    travelerGroups,
    tourType,
    country,
    countries,
    pricingRows,
    extras,
    clientId,
    tourTitle,
    startCity,
    startCityCoordinates,
    endCity,
    endCityCoordinates,
    pickupPoint,
    transferIncluded,
    inclusions,
    exclusions,
    showPaymentDetails,
    selectedTheme,
    setSelectedTheme,
    heroImage,
    setHeroImage,
    useAutoPricing,
    vehicleId,
    markupPct,
    pickupTransferId,
    dropoffTransferId,
  } = useBuilder();

  const router = useRouter();
  const urlParams = useParams();
  const proposalId = urlParams.id as string;
  const [isProposalSaved, setIsProposalSaved] = useState(false);
  const [isHeroPickerOpen, setIsHeroPickerOpen] = useState(false);
  const [dayPickerOpen, setDayPickerOpen] = useState<{ dayNumber: number; accommodationName?: string } | null>(null);
  const [isThemePopoverOpen, setIsThemePopoverOpen] = useState(false);
  const { plan } = usePlan();
  const allowedThemes = plan ? ALLOWED_THEMES_BY_TIER[plan.effectiveTier] : ['minimalistic'];

  // Listen for hero image picker event from themes
  useEffect(() => {
    const handleOpenPicker = () => setIsHeroPickerOpen(true);
    window.addEventListener('openHeroImagePicker', handleOpenPicker);
    return () => window.removeEventListener('openHeroImagePicker', handleOpenPicker);
  }, []);

  // Listen for day image picker event from themes
  useEffect(() => {
    const handleOpenDayPicker = (e: CustomEvent<{ dayNumber: number; accommodationName?: string }>) => {
      setDayPickerOpen({ dayNumber: e.detail.dayNumber, accommodationName: e.detail.accommodationName });
    };
    window.addEventListener('openDayImagePicker', handleOpenDayPicker as EventListener);
    return () =>
      window.removeEventListener('openDayImagePicker', handleOpenDayPicker as EventListener);
  }, []);

  // Fetch client info
  const { data: clientData } = trpc.clients.getById.useQuery(
    { id: clientId || '' },
    { enabled: !!clientId, staleTime: staleTimes.clients },
  );

  const clientName = clientData?.name || '';
  const clientEmail = clientData?.email || null;

  // Fetch accommodations for transform
  const { data: accommodationsData } = trpc.accommodations.getAll.useQuery(undefined, {
    staleTime: staleTimes.accommodations,
  });

  // All national parks (id + name) so we can resolve the proposal's day
  // destinations to their R2 image folders, even when a day's destination was
  // typed as free text rather than picked from the park list.
  const { data: nationalParksData } = trpc.nationalParks.getAll.useQuery(undefined, {
    staleTime: staleTimes.accommodations,
  });

  // The park ids that actually have an image folder in R2. Several parks have
  // empty duplicate records (e.g. a lowercase "bwindi" slug alongside "Bwindi
  // Impenetrable National Park"); only the one with a folder here has images, so
  // we restrict the proposal grid to these.
  const { data: parkFoldersData } = trpc.storage.getFolders.useQuery(
    { parentFolder: NATIONAL_PARKS_FOLDER },
    { staleTime: staleTimes.storage },
  );

  const { data: orgSettings } = trpc.settings.getOrg.useQuery();

  const accommodationsMap = useMemo(() => {
    const map: Record<string, { id: string; name: string; image?: string; images?: string[]; description?: string }> =
      {};
    accommodationsData?.forEach((a: any) => {
      const imageUrls = a.images?.map((img: any) => img.url).filter(Boolean) || [];
      map[a.id] = {
        id: a.id,
        name: a.name,
        description: a.overview || undefined,
        image: imageUrls[0] || undefined,
        images: imageUrls.length > 0 ? imageUrls : undefined,
      };
    });
    return map;
  }, [accommodationsData]);

  // National parks referenced by this proposal, resolved to their R2 image
  // folders. Surfaced as a quick-access grid in the image picker so the user
  // lands on their proposal's parks instead of an empty search box. A day links
  // to a park either directly (destination is a park id) or by name (free-text
  // destination that matches a park), so we resolve both.
  const proposalParkFolders = useMemo(() => {
    const folderIds = new Set((parkFoldersData ?? []).map((f) => f.name));
    // Only parks that have an image folder in R2 are candidates.
    const parks = (nationalParksData ?? []).filter((p) => folderIds.has(p.id));
    const byId = new Map(parks.map((p) => [p.id, p]));
    // Match on the significant tokens of the name, ignoring generic words like
    // "national"/"park" so "Bwindi Impenetrable park" resolves to the park
    // record named "Bwindi Impenetrable National Park".
    const coreTokens = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t && !['national', 'park', 'forest', 'reserve', 'conservation', 'area', 'game', 'np'].includes(t));
    const parkCores = parks.map((p) => ({ park: p, core: coreTokens(p.name).join(' ') }));

    const seen = new Set<string>();
    const folders: { name: string; path: string; displayName: string }[] = [];
    for (const day of days) {
      // 1) Direct park id on the destination.
      let park = day.destination && UUID_RE.test(day.destination) ? byId.get(day.destination) : undefined;
      // 2) Otherwise match the destination name against the park list.
      if (!park) {
        const dayCore = coreTokens(day.destinationName || '').join(' ');
        if (dayCore) {
          park = parkCores.find(
            ({ core }) => core && (core === dayCore || core.includes(dayCore) || dayCore.includes(core)),
          )?.park;
        }
      }
      if (park && !seen.has(park.id)) {
        seen.add(park.id);
        folders.push({
          name: park.id,
          path: `${NATIONAL_PARKS_FOLDER}/${park.id}`,
          displayName: park.name,
        });
      }
    }
    return folders;
  }, [days, nationalParksData, parkFoldersData]);

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
      startCity,
      startCityCoordinates,
      endCity,
      endCityCoordinates,
      tourType,
      country: countries.length > 0
        ? countries.map((c: string) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()).join(' & ')
        : country || undefined,
      showPaymentDetails,
      accommodationsMap,
      organization: orgSettings ? {
        name: orgSettings.name,
        logoUrl: orgSettings.logoUrl,
        aboutDescription: orgSettings.aboutDescription,
        paymentTerms: orgSettings.paymentTerms,
      } : undefined,
    });
  }, [
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
    startCity,
    startCityCoordinates,
    endCity,
    endCityCoordinates,
    tourType,
    country,
    showPaymentDetails,
    accommodationsMap,
    orgSettings,
  ]);

  const saveProposalMutation = trpc.proposals.save.useMutation();
  const sendToClientMutation = trpc.proposals.sendToClient.useMutation();

  // Share Proposal Mutation
  const shareProposalMutation = useMutation({
    mutationFn: async () => {
      if (!tourId) {
        throw new Error('Tour ID is required to save proposal.');
      }

      const proposalData = {
        days,
        startDate: startDate ? toLocalISOString(startDate) : null,
        travelerGroups,
        tourType,
        pricingRows,
        extras,
        clientId,
        tourTitle,
        startCity,
        startCityLat: startCityCoordinates ? String(startCityCoordinates[1]) : null,
        startCityLng: startCityCoordinates ? String(startCityCoordinates[0]) : null,
        endCity,
        endCityLat: endCityCoordinates ? String(endCityCoordinates[1]) : null,
        endCityLng: endCityCoordinates ? String(endCityCoordinates[0]) : null,
        pickupPoint,
        transferIncluded,
        inclusions,
        exclusions,
        showPaymentDetails,
        countries,
        selectedTheme,
        heroImage,
        useAutoPricing,
        vehicleId,
        markupPct,
        pickupTransferRateId: pickupTransferId,
        dropoffTransferRateId: dropoffTransferId,
      };

      return await saveProposalMutation.mutateAsync({
        id: proposalId,
        name: tourTitle || 'Untitled Safari',
        data: proposalData,
        status: 'shared',
        tourId: tourId,
      });
    },
    onSuccess: async (result) => {
      const savedProposalId = result.id || proposalId;
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
      return await sendToClientMutation.mutateAsync({ proposalId });
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

  const handleHeroImageSelect = (url: string) => {
    setHeroImage(url);
    toast({
      title: 'Hero Image Updated',
      description: 'The hero image has been updated.',
    });
  };

  const handleDayTitleChange = (dayNumber: number, title: string) => {
    setDays((prevDays) =>
      prevDays.map((day) => (day.dayNumber === dayNumber ? { ...day, title } : day)),
    );
  };

  const handleDayImageSelect = (dayNumber: number, url: string) => {
    setDays((prevDays) =>
      prevDays.map((day) => (day.dayNumber === dayNumber ? { ...day, previewImage: url } : day)),
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
        <DialogContent className="sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>Select Hero Image</DialogTitle>
          </DialogHeader>
          <ImagePickerContent
            value={heroImage}
            onSelect={(url) => {
              handleHeroImageSelect(url);
              setIsHeroPickerOpen(false);
            }}
            isOpen={isHeroPickerOpen}
            suggestedFolders={proposalParkFolders}
          />
        </DialogContent>
      </Dialog>

      {/* Day Image Picker Dialog */}
      <Dialog
        open={dayPickerOpen !== null}
        onOpenChange={(open) => !open && setDayPickerOpen(null)}
      >
        <DialogContent className="sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>
              {dayPickerOpen?.accommodationName || `Day ${dayPickerOpen?.dayNumber}`}
            </DialogTitle>
          </DialogHeader>
          <ImagePickerContent
            value={days.find((d) => d.dayNumber === dayPickerOpen?.dayNumber)?.previewImage || ''}
            onSelect={(url) => {
              if (dayPickerOpen !== null) {
                handleDayImageSelect(dayPickerOpen.dayNumber, url);
                setDayPickerOpen(null);
              }
            }}
            initialFolder={dayPickerOpen?.accommodationName}
            isOpen={dayPickerOpen !== null}
            suggestedFolders={proposalParkFolders}
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
      ) : selectedTheme === 'discovery' ? (
        <DiscoveryTheme data={itineraryData} onHeroImageChange={handleHeroImageSelect} onDayImageChange={handleDayImageSelect} />
      ) : (
        <MinimalisticTheme data={itineraryData} onHeroImageChange={handleHeroImageSelect} onDayImageChange={handleDayImageSelect} />
      )}

      {/* Floating Action Bar */}
      <div className="fixed right-0 bottom-0 left-0 z-50 border-t bg-white p-4 shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Proposal generated on {format(new Date(), 'MMMM d, yyyy')}
            </div>

            {/* Theme Selector */}
            <Popover open={isThemePopoverOpen} onOpenChange={setIsThemePopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Palette className="h-4 w-4" />
                  Theme: {THEME_OPTIONS.find((t) => t.value === selectedTheme)?.label}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="start">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Select Theme</h4>
                  <div className="space-y-2">
                    {THEME_OPTIONS.map((theme) => {
                      const isLocked = !allowedThemes.includes(theme.value);
                      return (
                        <button
                          key={theme.value}
                          onClick={() => {
                            if (isLocked) return;
                            setSelectedTheme(theme.value);
                            setIsThemePopoverOpen(false);
                          }}
                          disabled={isLocked}
                          className={`w-full rounded-lg border p-3 text-left transition-colors ${
                            isLocked
                              ? 'cursor-not-allowed border-stone-100 bg-stone-50 opacity-60'
                              : selectedTheme === theme.value
                                ? 'border-green-600 bg-green-50'
                                : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">{theme.label}</div>
                            {isLocked && <Lock className="h-3.5 w-3.5 text-stone-400" />}
                          </div>
                          <div className="text-xs text-stone-500">
                            {isLocked ? 'Requires Pro plan' : theme.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {isProposalSaved && (
            <div className="mb-4">
              <EmailDeliveryStatus proposalId={proposalId} />
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              Edit Itinerary
            </Button>

            {isProposalSaved && (
              <>
                {/* PDF download hidden until design is finalized */}

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
