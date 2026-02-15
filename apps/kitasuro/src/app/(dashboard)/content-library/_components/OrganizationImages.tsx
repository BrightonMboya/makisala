'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@repo/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@repo/ui/dialog';
import { Input } from '@repo/ui/input';
import { ChevronLeft, ChevronRight, Expand, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/query-keys';
import { trpc } from '@/lib/trpc';
import type { OrganizationImage } from '@/app/(dashboard)/content-library/_components/ContentLibraryTabs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const GRID_ROW_HEIGHT = 8; // px — matches gridAutoRows
const GRID_GAP = 12; // px — matches gap

interface OrganizationImagesProps {
  initialImages: OrganizationImage[];
  initialNextCursor: string | null;
}

export function OrganizationImages({ initialImages, initialNextCursor }: OrganizationImagesProps) {
  const queryClient = useQueryClient();
  const utils = trpc.useUtils();
  const uploadMutation = trpc.contentLibrary.uploadImage.useMutation();
  const deleteMutation = trpc.contentLibrary.deleteImage.useMutation();
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.organizationImages,
    queryFn: ({ pageParam }) =>
      utils.contentLibrary.getOrgImages.fetch({ cursor: pageParam as string | undefined }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    initialData: {
      pages: [{ images: initialImages, nextCursor: initialNextCursor }],
      pageParams: [undefined],
    },
    staleTime: staleTimes.organizationImages,
  });

  const images = data?.pages.flatMap((page) => page.images) ?? [];

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handlePrev = useCallback(() => {
    setPreviewIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  }, []);

  const handleNext = useCallback(() => {
    setPreviewIndex((i) => (i !== null && i < images.length - 1 ? i + 1 : i));
  }, [images.length]);

  useEffect(() => {
    if (previewIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewIndex, handlePrev, handleNext]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`${file.name}: Invalid file type. Allowed: JPEG, PNG, WebP, GIF`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name}: File size exceeds 10MB limit`);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        const result = await uploadMutation.mutateAsync({
          name: file.name,
          type: file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
          base64,
        });

        if (result) {
          // Invalidate to refetch from server with the new image
          queryClient.invalidateQueries({ queryKey: queryKeys.organizationImages });
        }
      } catch (err) {
        console.error('Error uploading image:', err);
        setError('Failed to upload image');
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (imageId: string) => {
    setDeletingId(imageId);
    setError(null);

    // Optimistically remove from cache
    queryClient.setQueryData(queryKeys.organizationImages, (old: typeof data) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          images: page.images.filter((img) => img.id !== imageId),
        })),
      };
    });

    // Adjust preview index if needed
    setPreviewIndex((prev) => {
      if (prev === null) return null;
      const deletedIdx = images.findIndex((img) => img.id === imageId);
      if (deletedIdx === -1) return prev;
      if (prev > deletedIdx) return prev - 1;
      if (prev === deletedIdx) return null;
      return prev;
    });

    try {
      await deleteMutation.mutateAsync({ imageId });
    } catch (err) {
      setError('Failed to delete image');
      // Revert on failure
      queryClient.invalidateQueries({ queryKey: queryKeys.organizationImages });
    }
    setDeletingId(null);
  };

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">My Images</h2>
          <p className="text-sm text-gray-600">
            Upload images to use in your proposals and itineraries
          </p>
        </div>
        <div>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload Images
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12">
          <Plus className="mb-2 h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-600">No images uploaded yet</p>
          <p className="text-xs text-gray-500">Click &quot;Upload Images&quot; to add your first image</p>
        </div>
      ) : (
        <>
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            style={{ gridAutoRows: `${GRID_ROW_HEIGHT}px`, gap: `${GRID_GAP}px` }}
          >
            {images.map((image, index) => (
              <div
                key={image.id}
                data-masonry-item
                className="group relative cursor-pointer overflow-hidden rounded-md"
                style={{ gridRowEnd: 'span 20' }}
                onClick={() => setPreviewIndex(index)}
              >
                <img
                  src={image.url}
                  alt={image.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    const container = img.closest('[data-masonry-item]') as HTMLElement;
                    if (!container) return;
                    const colWidth = container.clientWidth;
                    const ratio = img.naturalHeight / img.naturalWidth;
                    const imgHeight = colWidth * ratio;
                    const span = Math.ceil((imgHeight + GRID_GAP) / (GRID_ROW_HEIGHT + GRID_GAP));
                    container.style.gridRowEnd = `span ${span}`;
                  }}
                />
                <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/20" />
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <button
                    type="button"
                    className="rounded-full bg-white/90 p-1.5 text-gray-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewIndex(index);
                    }}
                  >
                    <Expand className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-white/90 p-1.5 text-red-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(image.id);
                    }}
                    disabled={deletingId === image.id}
                  >
                    {deletingId === image.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent px-2.5 pt-6 pb-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <p className="truncate text-xs font-medium text-white drop-shadow-sm">{image.name}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={loadMoreRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}
        </>
      )}

      <Dialog
        open={previewIndex !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewIndex(null);
        }}
      >
        <DialogContent
          showCloseButton
          className="max-w-5xl border-none bg-black/90 p-0 sm:max-w-5xl"
        >
          <DialogTitle className="sr-only">
            {previewIndex !== null ? images[previewIndex]?.name : 'Image preview'}
          </DialogTitle>
          {previewIndex !== null && images[previewIndex] && (
            <div className="relative flex flex-col items-center">
              <div className="relative flex h-[80vh] w-full items-center justify-center">
                <Image
                  src={images[previewIndex].url}
                  alt={images[previewIndex].name}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  priority
                />
              </div>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={previewIndex === 0}
                    className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-opacity hover:bg-black/80 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={previewIndex === images.length - 1}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-opacity hover:bg-black/80 disabled:opacity-30"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <div className="w-full bg-black/80 px-4 py-3">
                <p className="truncate text-center text-sm text-white">
                  {images[previewIndex].name}
                </p>
                <p className="text-center text-xs text-gray-400">
                  {previewIndex + 1} of {images.length}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] ?? '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
