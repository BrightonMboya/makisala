'use client';

import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog';
import {
  getAllAccommodationFolders,
  getStorageFolders,
  getStorageImages,
  searchAccommodationFolders,
} from '@/app/itineraries/actions';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronRight, Folder, Home, Image as ImageIcon, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface StorageFolder {
  name: string;
  path: string;
  displayName?: string;
}

const ACCOMMODATIONS_BUCKET = 'accomodations';

interface ImagePickerContentProps {
  onSelect: (url: string) => void;
  value?: string;
  bucket?: string;
  /** Initial folder to navigate to when picker opens (e.g., accommodation name) */
  initialFolder?: string;
  /** Whether the picker is open (for controlled mode) */
  isOpen?: boolean;
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
}: ImagePickerContentProps) {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [pathDisplayNames, setPathDisplayNames] = useState<Map<string, string>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);

  const isAccommodationsBucket = bucket === ACCOMMODATIONS_BUCKET;
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  const getCurrentFolderPath = () => {
    return currentPath.length > 0 ? currentPath.join('/') : undefined;
  };

  const path = getCurrentFolderPath();
  const isAccommodationsRoot = isAccommodationsBucket && path === 'accommodations';

  // Query for initial folder search (to find the path for a given accommodation name)
  const { data: initialFolderResult } = useQuery({
    queryKey: ['accommodationSearch', initialFolder],
    queryFn: () => searchAccommodationFolders(initialFolder || ''),
    enabled: isAccommodationsBucket && !!initialFolder && isOpen && !hasInitialized,
    staleTime: 5 * 60 * 1000,
  });

  // Auto-navigate to initial folder when picker opens
  useEffect(() => {
    if (isOpen && initialFolder && initialFolderResult && initialFolderResult.length > 0 && !hasInitialized) {
      // Find exact or close match
      const exactMatch = initialFolderResult.find(
        (f) => f.displayName?.toLowerCase() === initialFolder.toLowerCase() ||
               f.name.toLowerCase() === initialFolder.toLowerCase()
      );
      const folder = exactMatch || initialFolderResult[0];

      if (folder) {
        const pathParts = folder.path.split('/');
        setCurrentPath(pathParts);

        // Store display name
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
  }, [isOpen, initialFolder, initialFolderResult, hasInitialized]);

  // Reset initialization when picker closes
  useEffect(() => {
    if (!isOpen) {
      setHasInitialized(false);
      setCurrentPath([]);
      setSearchQuery('');
    }
  }, [isOpen]);

  // Query for folders - uses DB for accommodations root, storage for others
  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['storageFolders', bucket, path, isAccommodationsRoot],
    queryFn: () =>
      isAccommodationsRoot ? getAllAccommodationFolders() : getStorageFolders(path, bucket),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  // Query for images
  const { data: images = [], isLoading: imagesLoading } = useQuery({
    queryKey: ['storageImages', bucket, path],
    queryFn: () => getStorageImages(path, bucket),
    enabled: isOpen && !isAccommodationsRoot,
    staleTime: 5 * 60 * 1000,
  });

  // Query for search results
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['accommodationSearch', debouncedSearchQuery],
    queryFn: () => searchAccommodationFolders(debouncedSearchQuery),
    enabled: isAccommodationsBucket && debouncedSearchQuery.length >= 2,
    staleTime: 2 * 60 * 1000,
  });

  const loading = foldersLoading || imagesLoading;

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
      setCurrentPath([]);
    } else {
      setCurrentPath(currentPath.slice(0, index + 1));
    }
    setSearchQuery('');
  };

  const getDisplayNameForPathSegment = (segment: string) => {
    return pathDisplayNames.get(segment) || segment;
  };

  const displayFolders = debouncedSearchQuery.length >= 2 ? searchResults : folders;

  return (
    <div className="flex h-[500px] flex-col">
      {/* Search Input - Only for accommodations bucket */}
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
        {currentPath.map((segment, index) => (
          <div key={`${segment}-${index}`} className="flex shrink-0 items-center">
            <ChevronRight className="h-4 w-4" />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => handleBreadcrumbClick(index)}
            >
              {getDisplayNameForPathSegment(segment)}
            </Button>
          </div>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading || isSearching ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
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
                  No accommodations found matching "{debouncedSearchQuery}"
                </div>
              )}

            {/* Images */}
            {!searchQuery && (
              <div>
                <h3 className="text-muted-foreground mb-2 text-sm font-medium">Images</h3>
                {images.length === 0 && currentPath.length > 0 ? (
                  <div className="text-muted-foreground text-sm">No images in this folder.</div>
                ) : images.length === 0 ? (
                  <div className="text-muted-foreground text-sm">
                    Navigate to a folder to see images.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {images.map((img) => (
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
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
