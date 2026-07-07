'use client';

import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Textarea } from '@repo/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/form';
import { TagInput } from '@repo/ui/tag-input';
import { Trash2, Plus } from 'lucide-react';
import { AsyncCombobox } from '@/components/itinerary-builder/async-combobox';
import { CountrySelect } from './country-select';

export const itinerarySchema = z.object({
  title: z.string().min(1, 'Day title is required').max(255, 'Title too long'),
  overview: z.string().max(5000, 'Overview too long').optional(),
  national_park_id: z.string().optional(),
  accommodation_id: z.string().optional(),
});

export const tourFormSchema = z.object({
  tourName: z.string().min(2, 'Tour name must be at least 2 characters').max(255, 'Tour name too long'),
  overview: z.string().min(10, 'Overview must be at least 10 characters').max(5000, 'Overview too long'),
  pricing: z.string().min(1, 'Pricing is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0,
    'Pricing must be a valid positive number'
  ),
  country: z.string().min(2, 'Country is required'),
  img_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  number_of_days: z.number().min(1, 'Number of days must be at least 1'),
  tags: z.array(z.string().max(50, 'Tag too long')).min(1, 'At least one tag is required'),
  itineraries: z.array(itinerarySchema).min(1, 'At least one day is required'),
});

export type TourFormData = z.infer<typeof tourFormSchema>;

export const emptyTourFormValues: TourFormData = {
  tourName: '',
  overview: '',
  pricing: '',
  country: '',
  img_url: '',
  number_of_days: 1,
  tags: [],
  itineraries: [{ title: 'Day 1', overview: '', national_park_id: '', accommodation_id: '' }],
};

export function TourForm({
  form,
  onSubmit,
  showImageField = true,
}: {
  form: UseFormReturn<TourFormData>;
  onSubmit: (data: TourFormData) => void;
  showImageField?: boolean;
}) {
  const utils = trpc.useUtils();

  const {
    fields: itineraryFields,
    append: appendItinerary,
    remove: removeItinerary,
  } = useFieldArray({
    control: form.control,
    name: 'itineraries',
  });

  return (
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
                  <CountrySelect value={field.value} onChange={field.onChange} />
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
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === '' ? undefined : parseInt(val, 10));
                      }}
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
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="5000"
                      {...field}
                    />
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

            {showImageField && (
              <FormField
                control={form.control}
                name="img_url"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                        <AsyncCombobox
                          value={field.value || null}
                          onChange={field.onChange}
                          onSearch={async (query) => {
                            const results = await utils.nationalParks.search.fetch({ query, limit: 20 });
                            return results.map((p) => ({ value: p.id, label: p.name }));
                          }}
                          onGetLabel={async (id) => {
                            const park = await utils.nationalParks.getById.fetch({ id });
                            return park?.name ?? null;
                          }}
                          placeholder="Search destinations..."
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
                        <AsyncCombobox
                          value={field.value || null}
                          onChange={field.onChange}
                          onSearch={async (query) => {
                            const results = await utils.accommodations.search.fetch({ query, limit: 20 });
                            return results.map((a) => ({ value: a.id, label: a.name }));
                          }}
                          onGetLabel={async (id) => {
                            const acc = await utils.accommodations.getLookup.fetch({ id });
                            return acc?.name ?? null;
                          }}
                          placeholder="Search accommodations..."
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
  );
}
