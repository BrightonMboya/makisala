import { Library } from 'lucide-react';
import { createServerCaller } from '@/server/trpc/caller';
import { ContentLibraryTabs } from './_components/ContentLibraryTabs';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const filters = await searchParams;
  const page = Number(filters.page) || 1;
  const query = filters.query as string;

  const trpc = await createServerCaller();
  const [{ accommodations, pagination }, orgImagesResult] = await Promise.all([
    trpc.contentLibrary.getAccommodationsWithStatus({ page, limit: 20, query }),
    trpc.contentLibrary.getOrgImages({ limit: 20 }),
  ]);

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
                Manage your images and browse accommodation photos
              </p>
            </div>
          </div>
        </div>

        <ContentLibraryTabs
          accommodations={accommodations}
          pagination={pagination}
          organizationImages={orgImagesResult.images}
          organizationImagesNextCursor={orgImagesResult.nextCursor}
          query={query}
        />
      </div>
    </div>
  );
}
