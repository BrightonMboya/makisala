'use client';

import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/dialog';
import {
  getStorageFolders,
  getStorageImages,
  searchAccommodationFolders,
  getAllAccommodationFolders,
} from '@/app/itineraries/actions';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronRight, Folder, Home, Image as ImageIcon, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StorageFolder {
  name: string;
  path: string;
  displayName?: string;
}

interface CloudinaryImagePickerProps {
  onSelect: (url: string) => void;
  value?: string;
  triggerLabel?: string;
  bucket?: string;
}

const ACCOMMODATIONS_BUCKET = 'accomodations';

export function CloudinaryImagePicker({
  onSelect,
  value,
  triggerLabel,
  bucket = ACCOMMODATIONS_BUCKET,
}: CloudinaryImagePickerProps) {
  const [images, setImages] = useState<{ public_id: string; secure_url: string }[]>([]);
  const [folders, setFolders] = useState<StorageFolder[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [pathDisplayNames, setPathDisplayNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StorageFolder[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const isAccommodationsBucket = bucket === ACCOMMODATIONS_BUCKET;

  const getCurrentFolderPath = () => {
    return currentPath.length > 0 ? currentPath.join('/') : undefined;
  };

  // Debounced search
  useEffect(() => {
    if (!isAccommodationsBucket || !searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchAccommodationFolders(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isAccommodationsBucket]);

  useEffect(() => {
    if (open) {
      fetchContent();
    }
  }, [open, currentPath]);

  async function fetchContent() {
    setLoading(true);
    try {
      const path = getCurrentFolderPath();

      // For accommodations bucket at root, fetch all accommodations from DB
      if (isAccommodationsBucket && path === 'accommodations') {
        const allAccommodations = await getAllAccommodationFolders();
        setFolders(allAccommodations);
        setImages([]);
      } else {
        const fetchedFolders = await getStorageFolders(path, bucket);
        setFolders(fetchedFolders);

        const fetchedImages = await getStorageImages(path, bucket);
        setImages(fetchedImages);
      }
    } catch (error) {
      console.error('Error fetching content', error);
    } finally {
      setLoading(false);
    }
  }

  const handleFolderClick = (folder: StorageFolder) => {
    const pathParts = folder.path.split('/');
    setCurrentPath(pathParts);

    // Store the display name for this path segment
    if (folder.displayName && folder.displayName !== folder.name) {
      setPathDisplayNames((prev) => {
        const newMap = new Map(prev);
        newMap.set(folder.name, folder.displayName!);
        return newMap;
      });
    }

    // Clear search when navigating
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentPath([]);
    } else {
      setCurrentPath(currentPath.slice(0, index + 1));
    }
    // Clear search when navigating
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSelect = (url: string) => {
    onSelect(url);
    setOpen(false);
  };

  const getDisplayNameForPathSegment = (segment: string) => {
    return pathDisplayNames.get(segment) || segment;
  };

  // Show search results if searching, otherwise show folders
  const displayFolders = searchQuery.length >= 2 ? searchResults : folders;

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
        <DialogContent className="flex h-[600px] max-w-4xl flex-col">
          <DialogHeader>
            <DialogTitle>Select Image</DialogTitle>
          </DialogHeader>

          {/* Search Input - Only for accommodations bucket */}
          {isAccommodationsBucket && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search accommodations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          )}

          {/* Breadcrumbs */}
          <div className="text-muted-foreground flex items-center gap-1 overflow-x-auto border-b pb-2 text-sm">
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

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
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
                      {searchQuery.length >= 2 ? 'Search Results' : 'Folders'}
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
                {searchQuery.length >= 2 && displayFolders.length === 0 && !isSearching && (
                  <div className="text-muted-foreground text-sm">
                    No accommodations found matching "{searchQuery}"
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
                            onClick={() => handleSelect(img.secure_url)}
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
