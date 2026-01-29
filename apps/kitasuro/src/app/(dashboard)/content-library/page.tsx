import Link from 'next/link';
import { Sparkles, Search } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { getAccommodationsWithContentStatus } from './actions';
import { AccommodationSelector } from './_components/AccommodationSelector';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const filters = await searchParams;
  const page = Number(filters.page) || 1;
  const query = filters.query as string;

  const { accommodations, pagination } = await getAccommodationsWithContentStatus({
    page,
    limit: 20,
    query,
  });

  return (
    <div className="mt-10 min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Content Library</h1>
              <p className="mt-1 text-gray-600">
                Search through our curated list of accomodations
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <form method="GET">
                <Input
                    name="query"
                    defaultValue={query}
                    placeholder="Search by name..."
                    className="pl-10"
                />
            </form>
          </div>
        </div>

        {/* Accommodation selector */}
        <AccommodationSelector accommodations={accommodations} />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <Button key={p} variant={p === pagination.page ? 'default' : 'outline'} size="sm" asChild>
                <Link href={`/content-creation?page=${p}${query ? `&query=${query}` : ''}`}>{p}</Link>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
