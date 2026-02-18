export interface CfImageOptions {
  width?: number
  height?: number
  quality?: number
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
  format?: 'auto' | 'webp' | 'avif' | 'json'
  sharpen?: number
  brightness?: number
  contrast?: number
  dpr?: number
}

/**
 * Wraps an R2 image URL with Cloudflare Image Transformations.
 * Requires Image Resizing to be enabled on the Cloudflare zone
 * serving the R2 bucket (e.g. assets.makisala.com).
 *
 * @example
 * // Basic optimization
 * cfImage('https://assets.makisala.com/img.jpg')
 *
 * // With resizing and sharpening
 * cfImage('https://assets.makisala.com/img.jpg', {
 *   width: 800,
 *   sharpen: 2,
 *   quality: 85,
 * })
 */
export function cfImage(
  imageUrl: string,
  options: CfImageOptions = {}
): string {
  const {
    width,
    height,
    quality = 85,
    fit = 'scale-down',
    format = 'auto',
    sharpen = 1,
    brightness,
    contrast,
    dpr,
  } = options

  const params: string[] = []

  params.push(`quality=${quality}`)
  params.push(`format=${format}`)
  params.push(`fit=${fit}`)
  if (sharpen) params.push(`sharpen=${sharpen}`)
  if (width) params.push(`width=${width}`)
  if (height) params.push(`height=${height}`)
  if (brightness) params.push(`brightness=${brightness}`)
  if (contrast) params.push(`contrast=${contrast}`)
  if (dpr) params.push(`dpr=${dpr}`)

  const paramString = params.join(',')

  try {
    const url = new URL(imageUrl)
    return `${url.origin}/cdn-cgi/image/${paramString}${url.pathname}`
  } catch {
    return imageUrl
  }
}

