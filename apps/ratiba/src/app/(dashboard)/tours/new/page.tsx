'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '@/lib/trpc';
import { Button } from '@repo/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@repo/ui/use-toast';
import {
  TourForm,
  tourFormSchema,
  emptyTourFormValues,
  type TourFormData,
} from '../../_components/tour-form';

export default function NewTourPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TourFormData>({
    resolver: zodResolver(tourFormSchema),
    defaultValues: emptyTourFormValues,
  });

  const createMutation = trpc.tours.create.useMutation({
    onSuccess: (result) => {
      toast({ title: 'Tour created successfully' });
      queryClient.invalidateQueries({ queryKey: [['tours', 'list']] });
      router.push(`/tours/${result.tourId}`);
    },
    onError: (error) => {
      toast({
        title: 'Failed to create tour',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: TourFormData) => {
    createMutation.mutate({
      tourName: data.tourName,
      overview: data.overview,
      pricing: data.pricing,
      country: data.country,
      tags: data.tags,
      img_url: data.img_url,
      number_of_days: data.number_of_days,
      itineraries: data.itineraries.map((it, index) => ({
        dayNumber: index + 1,
        ...it,
      })),
    });
  };

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
          <h2 className="font-serif text-2xl font-bold text-stone-900">New Tour</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/tours">Cancel</Link>
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={createMutation.isPending}
            className="bg-green-700 hover:bg-green-800"
          >
            <Save className="h-4 w-4 mr-2" />
            {createMutation.isPending ? 'Creating...' : 'Create Tour'}
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          <TourForm form={form} onSubmit={onSubmit} showImageField={false} />
        </div>
      </div>
    </div>
  );
}
