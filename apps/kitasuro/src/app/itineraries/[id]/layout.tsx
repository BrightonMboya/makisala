'use client';

import { Button } from '@repo/ui/button';
import { ChevronRight, Plus, Users, Info, Check, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams, useParams } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';
import { Input } from '@repo/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { BuilderProvider, useBuilder } from '@/components/itinerary-builder/builder-context';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@repo/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import type { TravelerGroup } from '@/types/itinerary-types';
import { useMemo } from 'react';
import { saveProposal } from '@/app/itineraries/actions';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@repo/ui/toast';
import { useProposalData, useClientData } from '@/lib/hooks/use-proposal-data';

function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    tourId,
    tourType,
    setTourType,
    travelerGroups,
    setTravelerGroups,
    clientId,
    tourTitle,
    days,
    startDate,
    pricingRows,
    extras,
    startCity,
    endCity,
    pickupPoint,
    transferIncluded,
    inclusions,
    exclusions,
    selectedTheme,
    heroImage,
  } = useBuilder();

  const params = useParams();
  const id = params.id as string;

  // Fetch client name using React Query (cached)
  const { data: clientData } = useClientData(clientId);
  const clientName = clientData?.name || '';

  // Save Draft Mutation
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (!tourId) {
        throw new Error('Tour ID is required to save. Please go back to dashboard and create a new proposal.');
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
        endCity,
        pickupPoint,
        transferIncluded,
        inclusions,
        exclusions,
        selectedTheme,
        heroImage,
      };

      const result = await saveProposal({
        id,
        name: tourTitle || 'Untitled Safari',
        data: proposalData,
        status: 'draft',
        tourId,
      });

      if (!result.success) {
        throw new Error('Failed to save draft.');
      }

      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Draft Saved!',
        description: 'Your proposal has been saved as a draft.',
      });
    },
    onError: (error: Error) => {
      console.error('Save draft error:', error);
      toast({
        title: 'Failed to save draft',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Publish Proposal Mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!tourId) {
        throw new Error('Tour ID is required to publish. Please go back to dashboard and create a new proposal.');
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
        endCity,
        pickupPoint,
        transferIncluded,
        inclusions,
        exclusions,
        selectedTheme,
        heroImage,
      };

      const result = await saveProposal({
        id,
        name: tourTitle || 'Untitled Safari',
        data: proposalData,
        status: 'shared',
        tourId,
      });

      if (!result.success) {
        throw new Error('Failed to publish proposal.');
      }

      return result;
    },
    onSuccess: async (result) => {
      const savedId = (result as any).id || id;
      const link = `${window.location.origin}/proposal/${savedId}`;
      await navigator.clipboard.writeText(link);
      toast({
        title: 'Proposal Published!',
        description: 'Link copied to clipboard.',
      });
    },
    onError: (error: Error) => {
      console.error('Publish error:', error);
      toast({
        title: 'Failed to publish',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Helper to calculate total travelers
  const totalTravelers = travelerGroups.reduce((acc, curr) => acc + curr.count, 0);

  // Helper to update a specific group
  const updateGroup = (id: string, field: 'count' | 'type', value: any) => {
    setTravelerGroups((groups: TravelerGroup[]) =>
      groups.map((g) => (g.id === id ? { ...g, [field]: value } : g)),
    );
  };

  // Helper to add a new group
  const addGroup = () => {
    setTravelerGroups((groups: TravelerGroup[]) => [
      ...groups,
      { id: Math.random().toString(36).substr(2, 9), count: 1, type: 'Adult' },
    ]);
  };

  // Helper to remove a group
  const removeGroup = (id: string) => {
    setTravelerGroups((groups: TravelerGroup[]) => groups.filter((g) => g.id !== id));
  };

  const steps = [
    { id: 'day-by-day', label: 'Day by Day' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'preview', label: 'Preview' },
    { id: 'share', label: 'Share' },
  ];

  const currentStepIndex = steps.findIndex((step) => pathname.includes(step.id));

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <div className="h-6 w-px bg-stone-200" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2 font-serif font-bold text-stone-900">
              <span className="text-lg">{clientName || 'New Client'}</span>
              <span className="text-stone-300">/</span>
              <span className="text-base font-medium text-stone-600">
                {tourTitle || 'New Tour Request'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Travelers Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              >
                <Users className="h-4 w-4" />
                <span className="hidden font-medium sm:inline">{totalTravelers} Travelers</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-4">
                <h4 className="font-serif font-bold text-stone-900">Travelers</h4>
                <div className="space-y-3">
                  {travelerGroups.map((group, index) => (
                    <div key={group.id} className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        className="w-16"
                        value={group.count}
                        onChange={(e) =>
                          updateGroup(group.id, 'count', parseInt(e.target.value) || 1)
                        }
                      />
                      <Select
                        value={group.type}
                        onValueChange={(value) => updateGroup(group.id, 'type', value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Adult">Adult</SelectItem>
                          <SelectItem value="Senior">Senior</SelectItem>
                          <SelectItem value="Child">Child</SelectItem>
                          <SelectItem value="Baby">Baby</SelectItem>
                        </SelectContent>
                      </Select>
                      {travelerGroups.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => removeGroup(group.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-dashed border-stone-300 text-stone-600 hover:bg-stone-50"
                    onClick={addGroup}
                  >
                    <Plus className="h-3 w-3" />
                    Add Group
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Tour Type Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              >
                <Info className="h-4 w-4" />
                <span className="hidden font-medium sm:inline">{tourType}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-4">
              <div className="space-y-4">
                <h4 className="font-serif font-bold text-stone-900">Tour Type</h4>
                <Select value={tourType} onValueChange={setTourType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Private Tour">Private Tour</SelectItem>
                    <SelectItem value="Group Tour">Group Tour</SelectItem>
                    <SelectItem value="Self-drive">Self-drive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>

          <div className="h-6 w-px bg-stone-200" />

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              onClick={() => saveDraftMutation.mutate()}
              disabled={saveDraftMutation.isPending}
            >
              {saveDraftMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              {saveDraftMutation.isPending ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              size="sm"
              className="gap-2 border-transparent bg-green-700 text-white shadow-sm hover:bg-green-800"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              {publishMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              {publishMutation.isPending ? 'Publishing...' : 'Publish Proposal'}
            </Button>
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex justify-center border-t border-stone-200 bg-stone-50/50 backdrop-blur-sm">
        <div className="flex">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            const stepHref = `/itineraries/${id}/${step.id}`;

            return (
              <div key={step.id} className="flex items-center">
                <Link
                  href={stepHref}
                  className={`flex items-center gap-2 border-b-2 px-8 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-green-600 bg-green-50/50 text-green-800'
                      : isCompleted
                        ? 'border-transparent text-stone-900 hover:bg-stone-100'
                        : 'border-transparent text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ring-1 ring-inset ${
                      isActive
                        ? 'bg-green-600 text-white ring-green-600'
                        : isCompleted
                          ? 'bg-green-100 text-green-700 ring-green-200'
                          : 'bg-transparent text-stone-400 ring-stone-300'
                    }`}
                  >
                    {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                  </div>
                  <span className={isActive ? 'font-bold' : ''}>{step.label}</span>
                </Link>
                {index < steps.length - 1 && <ChevronRight className="h-4 w-4 text-stone-300" />}
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}

function BuilderLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppSidebar />
      <SidebarInset className="bg-gray-50">
        <Header />
        <main>{children}</main>
      </SidebarInset>
    </>
  );
}

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const tourId = searchParams.get('tourId');
  const startDateParam = searchParams.get('startDate');
  const clientIdParam = searchParams.get('clientId');
  const tourTitleParam = searchParams.get('tourTitle');
  const tourTypeParam = searchParams.get('tourType');
  const travelersParam = searchParams.get('travelers');
  const params = useParams();
  const id = params.id as string;

  const isNewProposal = !id || id === 'new';

  // Use React Query for data fetching (cached, deduped)
  const { proposal, tourTemplate, isLoading } = useProposalData({
    proposalId: id,
    tourId,
    isNewProposal,
  });

  // Transform data into initialData format (memoized)
  const initialData = useMemo(() => {
    // Base data from URL params
    let data: any = {
      tourId: tourId,
      startDate: startDateParam ? new Date(startDateParam) : undefined,
      clientId: clientIdParam,
      tourTitle: tourTitleParam,
      tourType: tourTypeParam,
    };

    // Convert travelers count to travelerGroups if provided
    if (travelersParam) {
      const travelersCount = parseInt(travelersParam, 10);
      if (!isNaN(travelersCount) && travelersCount > 0) {
        data.travelerGroups = [{ id: '1', count: travelersCount, type: 'Adult' }];
      }
    }

    // If we have proposal data, use it
    if (proposal) {
      data = {
        ...data,
        tourId: proposal.tourId || tourId,
        tourTitle: proposal.tourTitle || proposal.name,
        tourType: proposal.tourType || data.tourType,
        clientId: proposal.clientId || data.clientId,
        country: (proposal as any).country || null,
        startDate: proposal.startDate ? new Date(proposal.startDate) : data.startDate,
        startCity: proposal.startCity || '',
        endCity: proposal.endCity || '',
        pickupPoint: proposal.pickupPoint || '',
        transferIncluded: proposal.transferIncluded || 'excluded',
        travelerGroups: (proposal.travelerGroups as any) || data.travelerGroups,
        pricingRows: (proposal.pricingRows as any) || [],
        extras: (proposal.extras as any) || [],
        inclusions: proposal.inclusions || [],
        exclusions: proposal.exclusions || [],
        selectedTheme: proposal.theme || 'minimalistic',
        heroImage: proposal.heroImage || null,
        days: (proposal.days || []).map((day: any) => ({
          id: day.id,
          dayNumber: day.dayNumber,
          date: undefined,
          destination: day.nationalParkId || null,
          accommodation: day.accommodations?.[0]?.accommodationId || null,
          accommodationName: day.accommodations?.[0]?.accommodation?.name || null,
          description: day.description || '',
          previewImage: day.previewImage || undefined,
          meals: {
            breakfast: day.meals?.breakfast || false,
            lunch: day.meals?.lunch || false,
            dinner: day.meals?.dinner || false,
          },
          activities: (day.activities || []).map((act: any) => ({
            id: act.id,
            name: act.name,
            description: act.description,
            location: act.location,
            moment: act.moment,
            isOptional: act.isOptional,
            imageUrl: act.imageUrl,
            time: act.time,
          })),
        })),
      };
    } else if (tourTemplate) {
      // Fallback to tour template data (includes country)
      data = { ...data, ...tourTemplate };
      if (!data.travelerGroups && travelersParam) {
        const travelersCount = parseInt(travelersParam, 10);
        if (!isNaN(travelersCount) && travelersCount > 0) {
          data.travelerGroups = [{ id: '1', count: travelersCount, type: 'Adult' }];
        }
      }
    }

    return data;
  }, [proposal, tourTemplate, tourId, startDateParam, clientIdParam, tourTitleParam, tourTypeParam, travelersParam]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-stone-600">Loading proposal...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <BuilderProvider initialData={initialData}>
        <BuilderLayoutContent>{children}</BuilderLayoutContent>
      </BuilderProvider>
    </SidebarProvider>
  );
}
