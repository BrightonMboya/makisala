'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { deleteOrganizationImage, uploadOrganizationImage } from '../actions';
import type { OrganizationImage } from '@/app/(dashboard)/content-library/_components/ContentLibraryTabs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface OrganizationImagesProps {
  initialImages: OrganizationImage[];
}

export function OrganizationImages({ initialImages }: OrganizationImagesProps) {
  const [images, setImages] = useState(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      // Client-side validation
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
        const result = await uploadOrganizationImage({
          name: file.name,
          type: file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
          base64,
        });

        if (result.success && result.image) {
          setImages((prev) => [
            { ...result.image, createdAt: new Date() } as OrganizationImage,
            ...prev,
          ]);
        } else if (!result.success) {
          setError(result.error ?? 'Failed to upload image');
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
    const result = await deleteOrganizationImage(imageId);
    if (result.success) {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } else {
      setError(result.error ?? 'Failed to delete image');
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
          <p className="text-xs text-gray-500">Click "Upload Images" to add your first image</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-video overflow-hidden rounded-lg border bg-gray-100"
            >
              <Image src={image.url} alt={image.name} fill className="object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(image.id)}
                  disabled={deletingId === image.id}
                >
                  {deletingId === image.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="truncate text-xs text-white">{image.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64 = result.split(',')[1] ?? '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
