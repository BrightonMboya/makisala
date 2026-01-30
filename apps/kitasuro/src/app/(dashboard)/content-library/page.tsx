import Link from 'next/link';
import { Library } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { getAccommodationsWithContentStatus } from './actions';
import { AccommodationSelector } from './_components/AccommodationSelector';
import { SearchInput } from './_components/SearchInput';

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
            <Library className="h-8 w-8 text-green-700" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Content Library</h1>
              <p className="mt-1 text-gray-600">
                Search through our curated list of accomodations
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <SearchInput />
        </div>

        {/* Accommodation selector */}
        <AccommodationSelector accommodations={accommodations} />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <Button key={p} variant={p === pagination.page ? 'default' : 'outline'} size="sm" asChild>
                <Link href={`/content-library?page=${p}${query ? `&query=${query}` : ''}`}>{p}</Link>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
