'use client';

import { useState, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '@/lib/trpc';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/ui/alert-dialog';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Pencil,
  Trash2,
  Save,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@repo/ui/use-toast';
import { useSession } from '@/components/session-context';
import { capitalize, formatPrice } from '@/lib/utils';
import {
  TourForm,
  tourFormSchema,
  emptyTourFormValues,
  type TourFormData,
} from '../../_components/tour-form';

export default function TourDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session } = useSession();

  const tourId = params.id as string;
  const isEditMode = searchParams.get('edit') === 'true';
  const [editMode, setEditMode] = useState(isEditMode);
  const [imgError, setImgError] = useState(false);

  const { data: tour, isLoading } = trpc.tours.getById.useQuery(
    { id: tourId },
    { enabled: !!tourId && !!session?.user?.id },
  );

  // Derive form values from tour data
  const formValues = useMemo(() => {
    if (!tour) return undefined;
    return {
      tourName: tour.tourName,
      overview: tour.overview,
      pricing: tour.pricing || '',
      country: tour.country,
      img_url: tour.img_url || '',
      number_of_days: tour.number_of_days,
      tags: tour.tags || [],
      itineraries:
        tour.days && tour.days.length > 0
          ? tour.days.map((day) => ({
              title: day.dayTitle || `Day ${day.dayNumber}`,
              overview: day.overview || '',
              national_park_id: day.national_park_id || '',
              accommodation_id: day.itineraryAccommodations?.[0]?.accommodationId || '',
            }))
          : [{ title: 'Day 1', overview: '', national_park_id: '', accommodation_id: '' }],
    };
  }, [tour]);

  const form = useForm<TourFormData>({
    resolver: zodResolver(tourFormSchema),
    values: formValues,
    defaultValues: emptyTourFormValues,
  });

  const updateMutation = trpc.tours.update.useMutation({
    onSuccess: () => {
      toast({ title: 'Tour updated successfully' });
      queryClient.invalidateQueries({ queryKey: [['tours', 'getById'], { input: { id: tourId } }] });
      queryClient.invalidateQueries({ queryKey: [['tours', 'list']] });
      setEditMode(false);
      router.replace(`/tours/${tourId}`);
    },
    onError: (error) => {
      toast({
        title: 'Failed to update tour',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = trpc.tours.delete.useMutation({
    onSuccess: () => {
      toast({ title: 'Tour deleted successfully' });
      queryClient.invalidateQueries({ queryKey: [['tours', 'list']] });
      router.push('/tours');
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete tour',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: TourFormData) => {
    updateMutation.mutate({
      id: tourId,
      ...data,
      itineraries: data.itineraries.map((it, index) => ({
        dayNumber: index + 1,
        ...it,
      })),
    });
  };

  const formattedPrice = tour ? formatPrice(tour.pricing) : '';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-stone-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-stone-50">
        <h2 className="text-xl font-semibold text-stone-900 mb-2">Tour not found</h2>
        <p className="text-stone-500 mb-4">This tour may have been deleted or you don't have access.</p>
        <Button asChild variant="outline">
          <Link href="/tours">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tours
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-stone-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-8 py-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/tours">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tours
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEditMode(false);
                  router.replace(`/tours/${tourId}`);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={updateMutation.isPending}
                className="bg-green-700 hover:bg-green-800"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEditMode(true);
                  router.replace(`/tours/${tourId}?edit=true`);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Tour</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{tour.tourName}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate({ id: tourId })}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {editMode ? (
          // Edit Mode
          <div className="max-w-4xl mx-auto p-8">
            <TourForm form={form} onSubmit={onSubmit} />
          </div>
        ) : (
          // View Mode
          <div className="max-w-4xl mx-auto p-8">
            {/* Hero Image */}
            <div className="relative rounded-xl overflow-hidden mb-6 h-72">
              <Image
                src={imgError ? '/placeholder.svg' : (tour.img_url || '/placeholder.svg')}
                alt={tour.tourName}
                fill
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover"
                priority
                onError={() => setImgError(true)}
              />
              <div className="absolute top-4 right-4">
                <Badge className="bg-white/90 text-stone-900 font-semibold shadow-sm text-lg px-3 py-1">
                  {formattedPrice}
                </Badge>
              </div>
            </div>

            {/* Tour Info */}
            <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
              <h1 className="font-serif text-3xl font-bold text-stone-900 mb-4">{tour.tourName}</h1>

              <div className="flex items-center gap-6 text-stone-600 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>{capitalize(tour.country)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>{tour.number_of_days} days</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {(tour.tags || []).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-stone-600 border-stone-300">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div>
                <h3 className="font-semibold text-stone-900 mb-2">Overview</h3>
                <p className="text-stone-600 leading-relaxed">{tour.overview}</p>
              </div>
            </div>

            {/* Itinerary Days */}
            {tour.days && tour.days.length > 0 && (
              <div className="bg-white rounded-xl border border-stone-200 p-6">
                <h2 className="font-serif text-xl font-bold text-stone-900 mb-4">Itinerary</h2>
                <div className="space-y-4">
                  {tour.days.map((day) => (
                    <div key={day.id} className="border-l-2 border-green-600 pl-4 py-2">
                      <h4 className="font-semibold text-stone-900">
                        Day {day.dayNumber}: {day.dayTitle || 'Untitled'}
                      </h4>
                      {day.overview && <p className="text-stone-600 text-sm mt-1">{day.overview}</p>}
                      {day.itineraryAccommodations && day.itineraryAccommodations.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-stone-500">
                          <Building2 className="h-4 w-4" />
                          <span>
                            {day.itineraryAccommodations
                              .map((ia) => ia.accommodation?.name)
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
