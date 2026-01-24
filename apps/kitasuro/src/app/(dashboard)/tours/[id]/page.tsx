'use client';

import { useState, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getTourById,
  updateTour,
  deleteTour,
  getAllNationalParks,
  getAllAccommodations,
} from '@/app/itineraries/actions';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Textarea } from '@repo/ui/textarea';
import { Badge } from '@repo/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/form';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@repo/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import { TagInput } from '@repo/ui/tag-input';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Pencil,
  Trash2,
  Save,
  Building2,
  Plus,
  CheckIcon,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@repo/ui/use-toast';
import { authClient } from '@/lib/auth-client';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';

const itinerarySchema = z.object({
  title: z.string().min(1, 'Day title is required'),
  overview: z.string().optional(),
  national_park_id: z.string().optional(),
  accommodation_id: z.string().optional(),
});

const tourFormSchema = z.object({
  tourName: z.string().min(2, 'Tour name must be at least 2 characters'),
  overview: z.string().min(10, 'Overview must be at least 10 characters'),
  pricing: z.string().min(1, 'Pricing is required'),
  country: z.string().min(2, 'Country is required'),
  img_url: z.string().optional(),
  number_of_days: z.number().min(1, 'Number of days must be at least 1'),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
  itineraries: z.array(itinerarySchema).min(1, 'At least one day is required'),
});

type TourFormData = z.infer<typeof tourFormSchema>;

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export default function TourDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const tourId = params.id as string;
  const isEditMode = searchParams.get('edit') === 'true';
  const [editMode, setEditMode] = useState(isEditMode);

  const { data: tour, isLoading } = useQuery({
    queryKey: ['tour', tourId],
    queryFn: () => getTourById(tourId),
    enabled: !!tourId && !!session?.user?.id,
  });

  const { data: parks = [] } = useQuery({
    queryKey: ['nationalParks'],
    queryFn: getAllNationalParks,
    enabled: editMode,
  });

  const { data: accommodations = [] } = useQuery({
    queryKey: ['accommodations'],
    queryFn: getAllAccommodations,
    enabled: editMode,
  });

  // Derive form values from tour data
  const formValues = useMemo(() => {
    if (!tour) return undefined;
    return {
      tourName: tour.tourName,
      overview: tour.overview,
      pricing: tour.pricing,
      country: tour.country,
      img_url: tour.img_url,
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
    defaultValues: {
      tourName: '',
      overview: '',
      pricing: '',
      country: '',
      img_url: '',
      number_of_days: 1,
      tags: [],
      itineraries: [{ title: 'Day 1', overview: '', national_park_id: '', accommodation_id: '' }],
    },
  });

  const {
    fields: itineraryFields,
    append: appendItinerary,
    remove: removeItinerary,
  } = useFieldArray({
    control: form.control,
    name: 'itineraries',
  });

  const updateMutation = useMutation({
    mutationFn: (data: TourFormData) =>
      updateTour(tourId, {
        ...data,
        itineraries: data.itineraries.map((it, index) => ({
          dayNumber: index + 1,
          ...it,
        })),
      }),
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: 'Tour updated successfully' });
        queryClient.invalidateQueries({ queryKey: ['tour', tourId] });
        queryClient.invalidateQueries({ queryKey: queryKeys.tours.list(session?.user?.id) });
        setEditMode(false);
        router.replace(`/tours/${tourId}`);
      } else {
        toast({ title: result.error || 'Failed to update tour', variant: 'destructive' });
      }
    },
    onError: () => {
      toast({ title: 'Failed to update tour', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTour(tourId),
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: 'Tour deleted successfully' });
        queryClient.invalidateQueries({ queryKey: queryKeys.tours.list(session?.user?.id) });
        router.push('/tours');
      } else {
        toast({ title: result.error || 'Failed to delete tour', variant: 'destructive' });
      }
    },
    onError: () => {
      toast({ title: 'Failed to delete tour', variant: 'destructive' });
    },
  });

  const onSubmit = (data: TourFormData) => {
    updateMutation.mutate(data);
  };

  const formattedPrice = tour
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(Number(tour.pricing))
    : '';

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
                  form.reset();
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
                      onClick={() => deleteMutation.mutate()}
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="tourName"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Tour Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Amazing Safari Adventure" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="tanzania">Tanzania</SelectItem>
                              <SelectItem value="rwanda">Rwanda</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="number_of_days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Days</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pricing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (USD)</FormLabel>
                          <FormControl>
                            <Input placeholder="5000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <TagInput
                              placeholder="Enter tags (press Enter)"
                              tags={field.value}
                              setTags={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="overview"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Overview</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe this tour..."
                              className="min-h-32"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </CardContent>
                </Card>

                {/* Itinerary Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-serif">Daily Itinerary</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        appendItinerary({
                          title: `Day ${itineraryFields.length + 1}`,
                          overview: '',
                          national_park_id: '',
                          accommodation_id: '',
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Day
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {itineraryFields.map((field, index) => (
                      <Card key={field.id} className="border-stone-200 bg-stone-50">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-medium">Day {index + 1}</CardTitle>
                            {itineraryFields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItinerary(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`itineraries.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Arrival Day" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`itineraries.${index}.national_park_id`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Destination / Park</FormLabel>
                                <SelectWithSearch
                                  value={field.value}
                                  onChange={field.onChange}
                                  options={parks.map((p) => ({ id: p.id, name: p.name }))}
                                  placeholder="Select destination..."
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`itineraries.${index}.accommodation_id`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Accommodation</FormLabel>
                                <SelectWithSearch
                                  value={field.value}
                                  onChange={field.onChange}
                                  options={accommodations.map((a) => ({ id: a.id, name: a.name }))}
                                  placeholder="Select accommodation..."
                                  allowNone
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`itineraries.${index}.overview`}
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Day Overview</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Day details..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </form>
            </Form>
          </div>
        ) : (
          // View Mode
          <div className="max-w-4xl mx-auto p-8">
            {/* Hero Image */}
            <div className="relative rounded-xl overflow-hidden mb-6">
              <img
                src={tour.img_url || '/placeholder.svg'}
                alt={tour.tourName}
                className="w-full h-72 object-cover"
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

// Reusable select with search component
function SelectWithSearch({
  value,
  onChange,
  options,
  placeholder,
  allowNone,
}: {
  value?: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; name: string }>;
  placeholder: string;
  allowNone?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedName = options.find((o) => o.id === value)?.name;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between" role="combobox">
          {selectedName || placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {allowNone && (
                <CommandItem
                  value="none"
                  onSelect={() => {
                    onChange('');
                    setOpen(false);
                  }}
                  className="text-stone-500 italic"
                >
                  None
                  <CheckIcon className={cn('ml-auto h-4 w-4', !value ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.name}
                  onSelect={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                >
                  {option.name}
                  <CheckIcon
                    className={cn('ml-auto h-4 w-4', value === option.id ? 'opacity-100' : 'opacity-0')}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
