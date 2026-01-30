'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent } from '@repo/ui/dialog';
import { Button } from '@repo/ui/button';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: { id: string; url: string }[];
  accommodationName: string;
  className?: string;
}

export function ImageGallery({ images, accommodationName, className }: ImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className={cn("flex h-full min-h-[400px] items-center justify-center bg-gray-100", className)}>
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }

  const handlePrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const currentImage = images[currentImageIndex]!;

  return (
    <>
      <div className={cn("relative h-full w-full overflow-hidden", className)}>
        {/* Main Image */}
        <div 
          className="relative h-full w-full cursor-pointer"
          onClick={() => setIsLightboxOpen(true)}
        >
          <Image
            src={currentImage.url}
            alt={`${accommodationName} - Image ${currentImageIndex + 1}`}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          
          {/* Overlay Gradient for contrast if needed */}
          <div className="absolute inset-0 bg-black/10 transition-colors hover:bg-black/0" />

          {/* Controls */}
          <div className="absolute bottom-4 right-4 z-10 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="absolute bottom-4 left-4 z-10 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[95vw] border-none bg-black/95 p-0 sm:max-w-[90vw]">
          <div className="relative flex h-[90vh] w-full items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-50 text-white hover:bg-white/20"
              onClick={() => setIsLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
              onClick={handleNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>

            <div className="relative h-full w-full">
              <Image
                src={currentImage.url}
                alt={`${accommodationName} - Fullscreen`}
                fill
                className="object-contain"
                priority
              />
            </div>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white">
               {currentImageIndex + 1} / {images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
