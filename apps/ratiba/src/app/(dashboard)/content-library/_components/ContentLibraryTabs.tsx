'use client';

import Link from 'next/link';
import { Building2, ImageIcon } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import { AccommodationSelector } from './AccommodationSelector';
import { SearchInput } from './SearchInput';
import { OrganizationImages } from './OrganizationImages';
import { UpgradePrompt } from '@/components/upgrade-prompt';

interface Accommodation {
  id: string;
  name: string;
  url: string | null;
  imageUrl: string | null;
}

export interface OrganizationImage {
  id: string;
  name: string;
  url: string;
  createdAt: Date;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ContentLibraryTabsProps {
  accommodations: Accommodation[];
  pagination: Pagination;
  organizationImages: OrganizationImage[];
  organizationImagesNextCursor: string | null;
  query?: string;
  canUploadImages: boolean;
}

export function ContentLibraryTabs({
  accommodations,
  pagination,
  organizationImages,
  organizationImagesNextCursor,
  query,
  canUploadImages,
}: ContentLibraryTabsProps) {

  return (
    <Tabs defaultValue="my-images" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="my-images" className="gap-2">
          <ImageIcon className="h-4 w-4" />
          My Images
        </TabsTrigger>
        <TabsTrigger value="accommodations" className="gap-2">
          <Building2 className="h-4 w-4" />
          Accommodations
        </TabsTrigger>
      </TabsList>

      <TabsContent value="my-images">
        {canUploadImages ? (
          <OrganizationImages initialImages={organizationImages} initialNextCursor={organizationImagesNextCursor} />
        ) : (
          <UpgradePrompt
            feature="Own Image Uploads"
            reason="Upload and manage your own images with the Pro plan or above."
            upgradeToTier="pro"
          />
        )}
      </TabsContent>

      <TabsContent value="accommodations">
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Accommodations</h2>
            <p className="text-sm text-gray-600">Browse images from our accommodation library</p>
          </div>

          <div className="mb-6 flex items-center gap-4">
            <SearchInput />
          </div>

          <AccommodationSelector accommodations={accommodations} />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === pagination.page ? 'default' : 'outline'}
                  size="sm"
                  asChild
                >
                  <Link href={`/content-library?page=${p}${query ? `&query=${query}` : ''}`}>
                    {p}
                  </Link>
                </Button>
              ))}
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
