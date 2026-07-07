'use client';

import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button';
import {
  Map,
  Search,
  Plus,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { staleTimes } from '@/lib/query-keys';
import { useSession } from '@/components/session-context';
import { useState, useMemo, useDeferredValue } from 'react';
import Link from 'next/link';
import TourCard from '../_components/tour-card';

export default function ToursPage() {
  const { session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const { data: tours = [], isLoading } = trpc.tours.list.useQuery(undefined, {
    staleTime: staleTimes.tours,
    enabled: !!session?.user?.id,
  });

  // Filter tours based on search query (deferred for performance)
  const filteredTours = useMemo(() => {
    if (!deferredSearchQuery.trim()) return tours;
    const query = deferredSearchQuery.toLowerCase();
    return tours.filter(
      (tour) =>
        tour.name.toLowerCase().includes(query) ||
        tour.country.toLowerCase().includes(query) ||
        (tour.tags || []).some((tag) => tag.toLowerCase().includes(query))
    );
  }, [tours, deferredSearchQuery]);

  return (
    <div className="flex flex-col h-full bg-stone-50">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-8 py-4">
        <h2 className="font-serif text-2xl font-bold text-stone-900">Tours</h2>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Search by name, country, tags..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button asChild className="bg-green-700 hover:bg-green-800 gap-2">
            <Link href="/tours/new">
              <Plus className="h-4 w-4" />
              New Tour
            </Link>
          </Button>
        </div>
      </header>

      <div className="p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          </div>
        ) : tours.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mx-auto h-12 w-12 text-stone-300 mb-4">
              <Map className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-stone-900">No tours yet</h3>
            <p className="text-stone-500 mt-1 mb-6">
              Create your first tour to get started with proposals.
            </p>
            <Button asChild className="bg-green-700 hover:bg-green-800 gap-2">
              <Link href="/tours/new">
                <Plus className="h-4 w-4" />
                New Tour
              </Link>
            </Button>
          </div>
        ) : filteredTours.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mx-auto h-12 w-12 text-stone-300 mb-4">
              <Search className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-stone-900">No tours found</h3>
            <p className="text-stone-500 mt-1">
              Try adjusting your search query.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTours.map((tour) => (
              <TourCard
                key={tour.id}
                tour={{
                  id: tour.id,
                  name: tour.name,
                  days: tour.days,
                  imageUrl: tour.imageUrl,
                  overview: tour.overview,
                  country: tour.country,
                  pricing: tour.pricing,
                  tags: tour.tags,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
