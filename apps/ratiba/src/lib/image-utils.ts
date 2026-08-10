import sharp from 'sharp'

export interface CompressedImage {
  buffer: Buffer
  contentType: string
  extension: string
}

export interface CompressImageOptions {
  quality?: number
  maxWidth?: number
  maxHeight?: number
}

/**
 * Compress an image buffer to WebP format with optional resizing
 */
export async function compressImage(
  input: Buffer | Uint8Array,
  options: CompressImageOptions = {}
): Promise<CompressedImage> {
  const { quality = 80, maxWidth = 2000, maxHeight = 2000 } = options

  const image = sharp(input)
  const metadata = await image.metadata()

  // Resize if image exceeds max dimensions
  if (
    metadata.width &&
    metadata.height &&
    (metadata.width > maxWidth || metadata.height > maxHeight)
  ) {
    image.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  // Convert to WebP with specified quality
  const buffer = await image
    .webp({ quality })
    .toBuffer()

  return {
    buffer,
    contentType: 'image/webp',
    extension: '.webp',
  }
}

/**
 * Generate a tiny (~20px) base64 data URI to use as a blur-up placeholder,
 * computed once at upload time instead of a live Cloudflare Image Resizing
 * request on every gallery load.
 */
export async function generateBlurPlaceholder(input: Buffer | Uint8Array): Promise<string> {
  const buffer = await sharp(input)
    .resize(20, 20, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 40 })
    .toBuffer()

  return `data:image/webp;base64,${buffer.toString('base64')}`
}

/**
 * Replace file extension with new one
 */
export function replaceExtension(filename: string, newExtension: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) {
    return filename + newExtension
  }
  return filename.substring(0, lastDot) + newExtension
}
