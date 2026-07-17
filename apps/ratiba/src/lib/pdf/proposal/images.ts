import { printImage } from '@/lib/cf-image';

/**
 * @react-pdf/renderer can only embed JPEG and PNG, and proposal images are stored
 * as webp on R2, so every image is fetched and transcoded up front. Rendering is
 * synchronous — there is no chance to await inside a component — so the document
 * reads from a prebuilt `ImageBook`.
 */

/** How an image is used, which sets how many pixels are worth embedding. */
export type ImageRole = 'hero' | 'feature' | 'thumb' | 'logo';

/**
 * Target widths in px, sized against how large each role prints, not the source.
 * A proposal carries ~10 photos per day and gets emailed, so every extra 100px is
 * paid for on all of them. These land near 200dpi at print size.
 */
const ROLE_WIDTH: Record<ImageRole, number> = {
  hero: 1100,
  feature: 720,
  thumb: 400,
  logo: 240,
};

/** JPEG quality. Below ~74 the sky gradients in safari photography start to band. */
const QUALITY = 76;

export interface ImageRequest {
  url: string;
  role: ImageRole;
}

/** A resolved image in the form react-pdf's <Image src> accepts directly. */
export interface PdfImage {
  data: Buffer;
  format: 'jpg' | 'png';
}

/** Resolved images keyed by their original (pre-transform) URL. */
export type ImageBook = Map<string, PdfImage>;

async function fetchOne(url: string, role: ImageRole): Promise<PdfImage | null> {
  try {
    // Cloudflare downscales at the edge when the asset is on our zone, saving a
    // multi-megabyte pull just to shrink it locally.
    const width = ROLE_WIDTH[role];
    const res = await fetch(printImage(url, width));
    if (!res.ok) return null;

    const input = Buffer.from(await res.arrayBuffer());
    const { default: sharp } = await import('sharp');
    const resized = sharp(input).resize(width, undefined, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    // Logos keep their alpha as PNG: flattening to JPEG stamps a white box around
    // the mark. Photography has no alpha to lose and is far smaller as JPEG.
    if (role === 'logo') {
      return { data: await resized.png().toBuffer(), format: 'png' };
    }

    return {
      data: await resized
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: QUALITY, progressive: false })
        .toBuffer(),
      format: 'jpg',
    };
  } catch {
    // A dead image URL must never fail a whole proposal; callers render a neutral
    // placeholder for anything missing from the book.
    return null;
  }
}

/**
 * Deduplicates by URL, since images repeat across day pages, galleries and the
 * alternatives section. Where one URL is requested at several roles the largest
 * wins, so a thumbnail never degrades the hero sharing its source.
 */
export async function resolveImages(requests: ImageRequest[]): Promise<ImageBook> {
  const widest = new Map<string, ImageRole>();
  for (const { url, role } of requests) {
    if (!url) continue;
    const current = widest.get(url);
    if (!current || ROLE_WIDTH[role] > ROLE_WIDTH[current]) widest.set(url, role);
  }

  const entries = await Promise.all(
    [...widest].map(async ([url, role]) => [url, await fetchOne(url, role)] as const),
  );

  const book: ImageBook = new Map();
  for (const [url, image] of entries) {
    if (image) book.set(url, image);
  }
  return book;
}
