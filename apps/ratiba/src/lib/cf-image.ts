export interface CfImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  format?: 'auto' | 'webp' | 'avif' | 'json' | 'jpeg' | 'png' | 'baseline-jpeg';
  sharpen?: number;
  brightness?: number;
  contrast?: number;
  dpr?: number;
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
/**
 * Print-surface image preset. Caps images for the proposal PDF (max 1600px, the
 * old downscaleImages target) via Cloudflare Image Resizing. Proposal images live
 * on our CF zone; anything not on it (a rare unchanged default) passes through
 * rather than getting a broken /cdn-cgi/image URL.
 */
export function printImage(imageUrl: string | undefined, width = 1600): string {
  if (!imageUrl) return '';
  try {
    if (!new URL(imageUrl).hostname.endsWith('makisala.com')) return imageUrl;
  } catch {
    return imageUrl;
  }
  // Force JPEG (not format=auto). Chromium's page.pdf() passes JPEG sources through
  // as compressed DCTDecode streams, but re-embeds AVIF/WebP as near-uncompressed
  // flate bitmaps (a capped 1600px photo balloons from ~200KB to ~2MB in the PDF).
  return cfImage(imageUrl, { width, quality: 82, format: 'jpeg' });
}

/**
 * Strip an existing Cloudflare Image Resizing prefix so cfImage is idempotent.
 * `https://h/cdn-cgi/image/<opts>/<source>` -> the original `<source>` URL.
 * Wrapping an already-wrapped URL yields a nested path that 404s, and some stored
 * URLs (via getPublicUrl) already carry the prefix.
 */
function stripCfImagePrefix(imageUrl: string): string {
  const marker = '/cdn-cgi/image/';
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return imageUrl;
  const origin = imageUrl.slice(0, idx);
  const rest = imageUrl.slice(idx + marker.length); // "<opts>/<source...>"
  const slash = rest.indexOf('/');
  if (slash === -1) return imageUrl;
  const source = rest.slice(slash + 1);
  // The source segment can itself be a full URL (remote origin) or a same-host path.
  if (/^https?:\/\//i.test(source)) return source;
  return `${origin}/${source}`;
}

export function cfImage(imageUrl: string, options: CfImageOptions = {}): string {
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
  } = options;

  const params: string[] = [];

  params.push(`quality=${quality}`);
  params.push(`format=${format}`);
  params.push(`fit=${fit}`);
  if (sharpen) params.push(`sharpen=${sharpen}`);
  if (width) params.push(`width=${width}`);
  if (height) params.push(`height=${height}`);
  if (brightness) params.push(`brightness=${brightness}`);
  if (contrast) params.push(`contrast=${contrast}`);
  if (dpr) params.push(`dpr=${dpr}`);

  const paramString = params.join(',');

  try {
    // Idempotent: unwrap any existing prefix so we never nest /cdn-cgi/image/.
    const source = stripCfImagePrefix(imageUrl);
    const url = new URL(source);
    const pathname = url.pathname.toLowerCase();

    // Some R2 assets are stored as AVIF and may fail through Image Resizing.
    // Serve AVIF files directly from the bucket URL instead.
    if (pathname.endsWith('.avif')) {
      return source;
    }

    return `${url.origin}/cdn-cgi/image/${paramString}${url.pathname}`;
  } catch {
    return imageUrl;
  }
}
