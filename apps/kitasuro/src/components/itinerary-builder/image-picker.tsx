'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Check, Search, Image as ImageIcon } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

interface ImagePickerProps {
  value?: string;
  onChange: (url: string) => void;
}

export function ImagePicker({ value, onChange }: ImagePickerProps) {
  const [search, setSearch] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  // Use React Query for caching - shares cache with other components
  const { data: parksData } = trpc.nationalParks.getAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const { data: accommodationsData } = trpc.accommodations.getAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  // Get page IDs for parks that have them
  const parkPageIds = useMemo(
    () => (parksData || []).filter((p) => p.overview_page_id).map((p) => p.overview_page_id!),
    [parksData]
  );

  // Fetch page images only when we have park page IDs
  const { data: pagesData } = trpc.tours.getPageImages.useQuery(
    { pageIds: parkPageIds },
    { enabled: parkPageIds.length > 0, staleTime: 5 * 60 * 1000 },
  );

  // Build the images list from cached data
  const images = useMemo(() => {
    const imageList: Array<{ category: string; name: string; url: string }> = [];

    // Add national park images
    if (parksData && pagesData) {
      const pageMap = new Map(pagesData.map((p) => [p.id, p.featured_image_url]));
      parksData.forEach((park) => {
        const imageUrl = park.overview_page_id ? pageMap.get(park.overview_page_id) : null;
        if (imageUrl) {
          imageList.push({
            category: 'Destinations',
            name: park.name,
            url: imageUrl,
          });
        }
      });
    }

    // Add accommodation images
    (accommodationsData || []).forEach((acc: any) => {
      if (acc.images && acc.images.length > 0) {
        acc.images.forEach((img: any) => {
          imageList.push({
            category: 'Accommodations',
            name: acc.name,
            url: img.imageUrl,
          });
        });
      }
    });

    return imageList;
  }, [parksData, pagesData, accommodationsData]);

  const filteredImages = images.filter((img) =>
    img.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl) {
      onChange(customUrl);
    }
  };

  return (
    <div className="w-[400px] rounded-lg border border-stone-200 bg-white p-4 shadow-lg">
      <Tabs defaultValue="library" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="custom">Custom URL</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4">
          <div className="relative">
            <Search className="absolute top-2.5 left-2 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Search images..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="grid max-h-[300px] grid-cols-2 gap-2 overflow-y-auto pr-1">
            {filteredImages.map((img, idx) => (
              <button
                key={`${img.name}-${idx}`}
                className={cn(
                  'group relative aspect-video overflow-hidden rounded-md border-2 transition-all',
                  value === img.url
                    ? 'border-green-500'
                    : 'border-transparent hover:border-stone-300',
                )}
                onClick={() => onChange(img.url)}
              >
                <Image src={img.url} alt={img.name} fill className="object-cover" />
                <div
                  className={cn(
                    'absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity',
                    value === img.url ? 'opacity-100' : 'group-hover:opacity-100',
                  )}
                >
                  {value === img.url ? (
                    <Check className="h-6 w-6 text-white" />
                  ) : (
                    <span className="px-2 text-center text-xs font-medium text-white">
                      {img.name}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <form onSubmit={handleCustomUrlSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Image URL</label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
                <Button type="submit" size="icon" variant="outline">
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {(customUrl || value) && (
              <div className="relative aspect-video w-full overflow-hidden rounded-md border border-stone-200 bg-stone-50">
                <img
                  src={customUrl || value}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <div className="absolute inset-0 -z-10 flex items-center justify-center text-stone-400">
                  <ImageIcon className="h-8 w-8" />
                </div>
              </div>
            )}
            <p className="text-xs text-stone-500">
              Paste a direct link to an image (e.g. from Unsplash).
            </p>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
