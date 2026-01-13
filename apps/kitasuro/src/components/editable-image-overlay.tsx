'use client';

import { useState } from 'react';
import { Camera } from 'lucide-react';
import { CloudinaryImagePicker } from './cloudinary-image-picker';

interface EditableImageOverlayProps {
  currentImage: string;
  onImageChange: (url: string) => void;
  label?: string;
}

export function EditableImageOverlay({
  currentImage,
  onImageChange,
  label = 'Change Image',
}: EditableImageOverlayProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="absolute inset-0 z-20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover overlay */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Edit button */}
      <div
        className={`absolute top-4 right-4 transition-all duration-200 ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        <CloudinaryImagePicker
          value={currentImage}
          onSelect={onImageChange}
          triggerLabel={label}
        />
      </div>

      {/* Center camera icon */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex flex-col items-center gap-2 text-white">
          <Camera className="h-10 w-10" />
          <span className="text-sm font-medium uppercase tracking-wider">Click to change</span>
        </div>
      </div>
    </div>
  );
}
