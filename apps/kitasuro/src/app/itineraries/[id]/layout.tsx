'use client';

import { Button } from '@repo/ui/button';
import { ChevronLeft, ChevronRight, Plus, Users, Info, Check, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams, useParams } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';
import { Input } from '@repo/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { BuilderProvider, useBuilder } from '@/components/itinerary-builder/builder-context';
import type { TravelerGroup } from '@/types/itinerary-types';
import { useState, useEffect } from 'react';
import { getTourDetails } from '@/app/itineraries/actions';

function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { tourType, setTourType, travelerGroups, setTravelerGroups, clientName, tourTitle } =
    useBuilder();

  const params = useParams();
  const id = params.id as string;

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
  ];

  const currentStepIndex = steps.findIndex((step) => pathname.includes(step.id));

  return (
    <header className="fixed top-0 z-50 w-full border-b border-stone-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-stone-500 hover:bg-stone-100 hover:text-stone-900"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
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
              className="border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900"
            >
              Save Draft
            </Button>
            <Button
              size="sm"
              className="border-transparent bg-green-700 text-white shadow-sm hover:bg-green-800"
            >
              Publish Proposal
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

            return (
              <div key={step.id} className="flex items-center">
                <Link
                  href={`/itineraries/${id}/${step.id}`}
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
    <div className="min-h-screen bg-gray-50 pt-32">
      <Header />
      <main>{children}</main>
    </div>
  );
}

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const tourId = searchParams.get('tourId');
  const startDateParam = searchParams.get('startDate');
  const clientNameParam = searchParams.get('clientName');
  const tourTitleParam = searchParams.get('tourTitle');
  const tourTypeParam = searchParams.get('tourType');
  const travelersParam = searchParams.get('travelers');
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(!!tourId);

  useEffect(() => {
    const loadData = async () => {
      let data: any = {
        startDate: startDateParam ? new Date(startDateParam) : undefined,
        clientName: clientNameParam,
        tourTitle: tourTitleParam,
        tourType: tourTypeParam,
      };

      // Convert travelers count to travelerGroups if provided
      if (travelersParam) {
        const travelersCount = parseInt(travelersParam, 10);
        if (!isNaN(travelersCount) && travelersCount > 0) {
          data.travelerGroups = [
            {
              id: '1',
              count: travelersCount,
              type: 'Adult',
            },
          ];
        }
      }

      if (tourId) {
        const tourData = await getTourDetails(tourId);
        if (tourData) {
          data = {
            ...data,
            ...tourData,
          };
          // If travelerGroups weren't set from query param but we have tour data,
          // preserve any existing travelerGroups or use the query param
          if (!data.travelerGroups && travelersParam) {
            const travelersCount = parseInt(travelersParam, 10);
            if (!isNaN(travelersCount) && travelersCount > 0) {
              data.travelerGroups = [
                {
                  id: '1',
                  count: travelersCount,
                  type: 'Adult',
                },
              ];
            }
          }
        }
      }
      setInitialData(data);
      setLoading(false);
    };
    loadData();
  }, [tourId, startDateParam, clientNameParam, tourTitleParam, tourTypeParam, travelersParam]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <BuilderProvider initialData={initialData}>
      <BuilderLayoutContent>{children}</BuilderLayoutContent>
    </BuilderProvider>
  );
}
