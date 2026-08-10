const MAX_DIMENSION = 2000;
const QUALITY = 0.8;
const BLUR_DIMENSION = 20;
const BLUR_QUALITY = 0.4;

// Mirrors compressImage() in image-utils.ts (2000px max, WebP @ 0.8) so both
// upload paths produce the same output. GIFs may be animated (canvas only
// captures one frame) and AVIF gains little from re-encoding, so both pass
// through untouched.
const COMPRESSIBLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function replaceExtension(filename: string, newExtension: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? filename + newExtension : filename.slice(0, lastDot) + newExtension;
}

// JPEG (not WebP) for universal canvas.toDataURL() support — WebP encode via
// canvas isn't reliable across browsers, and at 20px the format barely matters.
function renderToDataUrl(bitmap: ImageBitmap, maxDim: number): string | null {
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', BLUR_QUALITY);
}

export interface CompressedImageResult {
  file: File;
  blurDataUrl: string | null;
}

/**
 * Resize + re-encode an image file to WebP in the browser before upload, and
 * generate a tiny blur-up placeholder from the same decode.
 *
 * The accommodation photo uploader PUTs files straight from the browser to
 * R2 via a presigned URL (to bypass the serverless body-size limit), so the
 * server-side compressImage()/generateBlurPlaceholder() in image-utils.ts
 * never run on them. This is the client-side equivalent for that one path.
 */
export async function compressImageFile(file: File): Promise<CompressedImageResult> {
  if (!COMPRESSIBLE_TYPES.has(file.type)) {
    return { file, blurDataUrl: null };
  }

  const bitmap = await createImageBitmap(file);
  const blurDataUrl = renderToDataUrl(bitmap, BLUR_DIMENSION);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return { file, blurDataUrl };
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', QUALITY),
  );
  // If re-encoding didn't actually shrink it (rare, e.g. a tiny already-optimized
  // PNG), keep the original rather than uploading a same-size WebP for no reason.
  if (!blob || blob.size >= file.size) {
    return { file, blurDataUrl };
  }

  return {
    file: new File([blob], replaceExtension(file.name, '.webp'), { type: 'image/webp' }),
    blurDataUrl,
  };
}
