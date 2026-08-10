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
 * Print-surface image preset: the source URL the proposal PDF fetches for an image.
 *
 * Previously asked Cloudflare to downscale at the edge to the caller's print width
 * (see lib/pdf/proposal/images.ts); now a passthrough to cfImage(), which no longer
 * transforms (see its docstring). Harmless now that uploads are pre-resized at
 * upload time, so the PDF render pulls an already-reasonable-sized photo anyway.
 */
export function printImage(imageUrl: string | undefined, width = 1600): string {
  if (!imageUrl) return '';
  try {
    if (!new URL(imageUrl).hostname.endsWith('makisala.com')) return imageUrl;
  } catch {
    return imageUrl;
  }
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

/**
 * Cloudflare Image Transformations disabled (2026-08-10): not worth the
 * $/mo at current traffic, and uploads are now pre-resized/compressed at
 * upload time (see image-utils.ts / client-image-compress.ts) plus the
 * one-time batch reprocess of existing R2 photos, so a live resize on every
 * request no longer earns its cost. This still unwraps any existing
 * /cdn-cgi/image/ prefix (idempotent) so stored/legacy URLs resolve to the
 * raw asset instead of a broken transform request.
 *
 * To re-enable, restore the param-building + `${url.origin}/cdn-cgi/image/${paramString}${url.pathname}`
 * behavior this replaced (see git history).
 */
export function cfImage(imageUrl: string, _options: CfImageOptions = {}): string {
  try {
    return stripCfImagePrefix(imageUrl);
  } catch {
    return imageUrl;
  }
}
