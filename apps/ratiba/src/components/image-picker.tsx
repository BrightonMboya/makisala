'use client';

import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import { trpc } from '@/lib/trpc';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Building2, ChevronRight, Folder, Home, Image as ImageIcon, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/query-keys';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface StorageFolder {
  name: string;
  path: string;
  displayName?: string;
}

const ACCOMMODATIONS_BUCKET = 'accomodations';

type ImageSource = 'accommodations' | 'organization';

interface ImagePickerContentProps {
  onSelect: (url: string) => void;
  value?: string;
  bucket?: string;
  /** Initial folder to navigate to when picker opens (e.g., accommodation name) */
  initialFolder?: string;
  /** Whether the picker is open (for controlled mode) */
  isOpen?: boolean;
  /** Default tab to show */
  defaultSource?: ImageSource;
}

/**
 * Standalone image picker content - use this when you want to control the dialog externally
 */
export function ImagePickerContent({
  onSelect,
  value,
  bucket = ACCOMMODATIONS_BUCKET,
  initialFolder,
  isOpen = true,
  defaultSource = 'accommodations',
}: ImagePickerContentProps) {
  const [activeSource, setActiveSource] = useState<ImageSource>(defaultSource);
  // Start inside the accommodations folder to avoid exposing other root-level folders
  const [currentPath, setCurrentPath] = useState<string[]>(
    bucket === ACCOMMODATIONS_BUCKET ? ['accommodations'] : []
  );
  const [pathDisplayNames, setPathDisplayNames] = useState<Map<string, string>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);

  const isAccommodationsBucket = bucket === ACCOMMODATIONS_BUCKET;
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const utils = trpc.useUtils();

  const getCurrentFolderPath = () => {
    return currentPath.length > 0 ? currentPath.join('/') : undefined;
  };

  const path = getCurrentFolderPath();
  const isAccommodationsRoot = isAccommodationsBucket && path === 'accommodations';

  // Query for initial folder search (to find the path for a given accommodation name)
  const { data: initialFolderResult } = useQuery({
    queryKey: ['accommodationSearch', initialFolder],
    queryFn: () => utils.storage.searchAccommodationFolders.fetch({ query: initialFolder || '' }),
    enabled: isAccommodationsBucket && !!initialFolder && isOpen && !hasInitialized && activeSource === 'accommodations',
    staleTime: staleTimes.storage,
  });

  // Auto-navigate to initial folder when picker opens
  useEffect(() => {
    if (isOpen && initialFolder && initialFolderResult && initialFolderResult.length > 0 && !hasInitialized && activeSource === 'accommodations') {
      const exactMatch = initialFolderResult.find(
        (f) => f.displayName?.toLowerCase() === initialFolder.toLowerCase() ||
               f.name.toLowerCase() === initialFolder.toLowerCase()
      );
      const folder = exactMatch || initialFolderResult[0];

      if (folder) {
        const pathParts = folder.path.split('/');
        setCurrentPath(pathParts);

        if (folder.displayName && folder.displayName !== folder.name) {
          setPathDisplayNames((prev) => {
            const newMap = new Map(prev);
            newMap.set(folder.name, folder.displayName!);
            return newMap;
          });
        }
      }
      setHasInitialized(true);
    }
  }, [isOpen, initialFolder, initialFolderResult, hasInitialized, activeSource]);

  // Reset initialization when picker closes
  useEffect(() => {
    if (!isOpen) {
      setHasInitialized(false);
      setCurrentPath(isAccommodationsBucket ? ['accommodations'] : []);
      setSearchQuery('');
    }
  }, [isOpen, isAccommodationsBucket]);

  // Query for folders - only when navigating inside a specific accommodation
  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['storageFolders', bucket, path],
    queryFn: () => utils.storage.getFolders.fetch({ parentFolder: path, bucket }),
    enabled: isOpen && activeSource === 'accommodations' && !isAccommodationsRoot,
    staleTime: staleTimes.storage,
  });

  // Query for accommodation images
  const { data: accommodationImages = [], isLoading: accommodationImagesLoading } = useQuery({
    queryKey: ['storageImages', bucket, path],
    queryFn: () => utils.storage.getImages.fetch({ folder: path, bucket }),
    enabled: isOpen && activeSource === 'accommodations' && !isAccommodationsRoot,
    staleTime: staleTimes.storage,
  });

  // Query for organization images (separate key from the infinite query in content library)
  const { data: orgImagesData, isLoading: orgImagesLoading } = useQuery({
    queryKey: [...queryKeys.organizationImages, 'picker'],
    queryFn: () => utils.contentLibrary.getOrgImages.fetch({ limit: 100 }),
    enabled: isOpen && activeSource === 'organization',
    staleTime: staleTimes.organizationImages,
  });
  const orgImages = orgImagesData?.images ?? [];

  // Query for search results
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['accommodationSearch', debouncedSearchQuery],
    queryFn: () => utils.storage.searchAccommodationFolders.fetch({ query: debouncedSearchQuery }),
    enabled: isAccommodationsBucket && debouncedSearchQuery.length >= 2 && activeSource === 'accommodations',
    staleTime: 2 * 60 * 1000,
  });

  const loading = activeSource === 'accommodations'
    ? (!isAccommodationsRoot && (foldersLoading || accommodationImagesLoading))
    : orgImagesLoading;

  const handleFolderClick = (folder: StorageFolder) => {
    const pathParts = folder.path.split('/');
    setCurrentPath(pathParts);

    if (folder.displayName && folder.displayName !== folder.name) {
      setPathDisplayNames((prev) => {
        const newMap = new Map(prev);
        newMap.set(folder.name, folder.displayName!);
        return newMap;
      });
    }

    setSearchQuery('');
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Go to accommodations root instead of bucket root to avoid exposing other folders
      setCurrentPath(isAccommodationsBucket ? ['accommodations'] : []);
    } else {
      setCurrentPath(currentPath.slice(0, index + 1));
    }
    setSearchQuery('');
  };

  const getDisplayNameForPathSegment = (segment: string) => {
    return pathDisplayNames.get(segment) || segment;
  };

  const displayFolders = debouncedSearchQuery.length >= 2
    ? searchResults
    : isAccommodationsRoot
      ? []
      : folders;

  const handleTabChange = (value: string) => {
    setActiveSource(value as ImageSource);
    setCurrentPath(value === 'accommodations' && isAccommodationsBucket ? ['accommodations'] : []);
    setSearchQuery('');
  };

  return (
    <div className="flex h-[500px] flex-col">
      <Tabs value={activeSource} onValueChange={handleTabChange} className="flex h-full flex-col">
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="accommodations" className="gap-2">
            <Building2 className="h-4 w-4" />
            Accommodations
          </TabsTrigger>
          <TabsTrigger value="organization" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            My Images
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accommodations" className="mt-0 flex min-h-0 flex-1 flex-col">
          {/* Search Input */}
          {isAccommodationsBucket && (
            <div className="relative mb-4">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search accommodations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          )}

          {/* Breadcrumbs */}
          <div className="text-muted-foreground mb-4 flex items-center gap-1 overflow-x-auto border-b pb-2 text-sm">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => handleBreadcrumbClick(-1)}
            >
              <Home className="h-4 w-4" />
            </Button>
            {currentPath
              .filter((segment) => !(isAccommodationsBucket && segment === 'accommodations'))
              .map((segment, _filteredIndex) => {
                // Find the real index in currentPath for correct breadcrumb navigation
                const realIndex = currentPath.indexOf(segment);
                return (
              <div key={`${segment}-${realIndex}`} className="flex shrink-0 items-center">
                <ChevronRight className="h-4 w-4" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => handleBreadcrumbClick(realIndex)}
                >
                  {getDisplayNameForPathSegment(segment)}
                </Button>
              </div>
                );
              })}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading || isSearching ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Search prompt at accommodations root */}
                {isAccommodationsRoot && debouncedSearchQuery.length < 2 && (
                  <div className="flex h-40 flex-col items-center justify-center text-center">
                    <Search className="mb-2 h-10 w-10 text-gray-300" />
                    <p className="text-muted-foreground text-sm">Search for an accommodation above</p>
                  </div>
                )}

                {/* Search Results or Folders */}
                {displayFolders.length > 0 && (
                  <div>
                    <h3 className="text-muted-foreground mb-2 text-sm font-medium">
                      {debouncedSearchQuery.length >= 2 ? 'Search Results' : 'Folders'}
                    </h3>
                    <div className="flex flex-col gap-1">
                      {displayFolders.map((folder) => (
                        <Button
                          key={folder.path}
                          variant="ghost"
                          className="h-auto justify-start px-3 py-2 font-normal"
                          onClick={() => handleFolderClick(folder)}
                        >
                          <Folder className="mr-2 h-4 w-4 fill-blue-500/20 text-blue-500" />
                          <span className="truncate">{folder.displayName || folder.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* No search results message */}
                {debouncedSearchQuery.length >= 2 &&
                  displayFolders.length === 0 &&
                  !isSearching && (
                    <div className="text-muted-foreground text-sm">
                      No accommodations found matching &ldquo;{debouncedSearchQuery}&rdquo;
                    </div>
                  )}

                {/* Images - only show when inside a specific accommodation folder */}
                {!searchQuery && !isAccommodationsRoot && (
                  <div>
                    <h3 className="text-muted-foreground mb-2 text-sm font-medium">Images</h3>
                    {accommodationImages.length === 0 ? (
                      <div className="text-muted-foreground text-sm">No images in this folder.</div>
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        {accommodationImages.map((img) => (
                          <div
                            key={img.public_id}
                            className={cn(
                              'group hover:ring-primary relative aspect-video cursor-pointer overflow-hidden rounded-md border transition-all hover:ring-2',
                              value === img.secure_url && 'ring-primary ring-2',
                            )}
                            onClick={() => onSelect(img.secure_url)}
                          >
                            <Image
                              src={img.secure_url}
                              alt={img.public_id}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="organization" className="mt-0 flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {orgImagesLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : orgImages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <ImageIcon className="mb-2 h-12 w-12 text-gray-300" />
                <p className="text-muted-foreground text-sm">No images uploaded yet</p>
                <p className="text-muted-foreground text-xs">
                  Go to Content Library to upload images
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {orgImages.map((img) => (
                  <div
                    key={img.id}
                    className={cn(
                      'group hover:ring-primary relative aspect-video cursor-pointer overflow-hidden rounded-md border transition-all hover:ring-2',
                      value === img.url && 'ring-primary ring-2',
                    )}
                    onClick={() => onSelect(img.url)}
                  >
                    <Image
                      src={img.url}
                      alt={img.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="truncate text-xs text-white">{img.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ImagePickerProps {
  onSelect: (url: string) => void;
  value?: string;
  triggerLabel?: string;
  bucket?: string;
  /** Initial folder to navigate to when picker opens (e.g., accommodation name) */
  initialFolder?: string;
  /** Default tab to show */
  defaultSource?: ImageSource;
}

/**
 * Full image picker with dialog trigger button - use this for standalone usage
 */
export function ImagePicker({
  onSelect,
  value,
  triggerLabel,
  bucket = ACCOMMODATIONS_BUCKET,
  initialFolder,
  defaultSource = 'accommodations',
}: ImagePickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (url: string) => {
    onSelect(url);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-4">
      {value && (
        <div className="relative h-20 w-32 overflow-hidden rounded-md border">
          <Image src={value} alt="Selected" fill className="object-cover" />
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            {triggerLabel || (value ? 'Change Image' : 'Select Image')}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Image</DialogTitle>
          </DialogHeader>
          <ImagePickerContent
            onSelect={handleSelect}
            value={value}
            bucket={bucket}
            initialFolder={initialFolder}
            isOpen={open}
            defaultSource={defaultSource}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
