import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://www.airbnb.com/',
};

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeHtmlEntities(input: string) {
  if (!input) return input;
  return input
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractMeta(html: string, attr: string, value: string) {
  const pattern = new RegExp(
    `<meta[^>]*${attr}=["']${escapeRegExp(value)}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    'i'
  );
  const altPattern = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*${attr}=["']${escapeRegExp(value)}["'][^>]*>`,
    'i'
  );
  const first = html.match(pattern);
  if (first?.[1]) return decodeHtmlEntities(first[1]);
  const second = html.match(altPattern);
  if (second?.[1]) return decodeHtmlEntities(second[1]);
  return null;
}

function extractJsonLdBlocks(html: string): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) blocks.push(item);
      } else {
        blocks.push(parsed);
      }
    } catch {
      // Ignore malformed JSON-LD
    }
  }
  return blocks;
}

function asArray(v: any) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function normalizeImageUrl(url: string) {
  const decoded = decodeHtmlEntities(url.trim());
  return decoded.split('?')[0];
}

function uniqueImages(values: any[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    if (typeof raw !== 'string') continue;
    const normalized = normalizeImageUrl(raw);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function extractListingId(url: string) {
  const m = url.match(/\/rooms\/(\d+)/);
  return m?.[1] ?? null;
}

// NOTE: These URL patterns are based on Airbnb's current CDN structure and may
// need updating if Airbnb changes their image hosting paths.
function extractListingImagesFromHtml(html: string, listingId: string | null) {
  const normalizedHtml = html.replace(/\\\//g, '/');
  const escapedListingId = listingId ? escapeRegExp(listingId) : null;
  const sourcePattern = escapedListingId
    ? new RegExp(
        `https://a0\\.muscache\\.com/im/pictures/hosting/Hosting-${escapedListingId}/original/[^"'\\s<)]+`,
        'g'
      )
    : /https:\/\/a0\.muscache\.com\/im\/pictures\/hosting\/Hosting-[^"'\s<)]+/g;

  const matches = normalizedHtml.match(sourcePattern) ?? [];
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const raw of matches) {
    const val = raw.trim();
    if (!val || seen.has(val)) continue;
    seen.add(val);
    unique.push(val);
  }
  return unique;
}

function parseLocation(vacationRental: any) {
  const addr = vacationRental?.address ?? {};
  return {
    locality: addr.addressLocality ?? null,
    region: addr.addressRegion ?? null,
    country: addr.addressCountry ?? null,
    latitude:
      typeof vacationRental?.latitude === 'number'
        ? vacationRental.latitude
        : vacationRental?.latitude
          ? Number(vacationRental.latitude)
          : null,
    longitude:
      typeof vacationRental?.longitude === 'number'
        ? vacationRental.longitude
        : vacationRental?.longitude
          ? Number(vacationRental.longitude)
          : null,
  };
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { url } = await req.json();

    if (!url || !/^https?:\/\//i.test(url) || !/airbnb\./i.test(url)) {
      return NextResponse.json({ error: 'Invalid Airbnb URL' }, { status: 400 });
    }

    const response = await fetch(url, { headers: DEFAULT_HEADERS, redirect: 'follow' });
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch listing (${response.status})` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const jsonLdBlocks = extractJsonLdBlocks(html);
    const listingId = extractListingId(url);

    const vacationRental = jsonLdBlocks.find((b) => {
      const types = asArray(b?.['@type']);
      return types.some((t: string) => String(t).toLowerCase() === 'vacationrental');
    });

    const product = jsonLdBlocks.find((b) => {
      const types = asArray(b?.['@type']);
      return types.some((t: string) => String(t).toLowerCase() === 'product');
    });

    const images = uniqueImages([
      ...asArray(vacationRental?.image),
      ...asArray(product?.image),
      ...extractListingImagesFromHtml(html, listingId),
    ]);

    const description =
      vacationRental?.description ??
      product?.description ??
      extractMeta(html, 'name', 'description') ??
      null;

    const location = parseLocation(vacationRental);
    if (!location.locality) {
      location.locality = extractMeta(html, 'property', 'og:locality') ?? null;
    }

    return NextResponse.json({
      listingId,
      name:
        vacationRental?.name ??
        product?.name ??
        extractMeta(html, 'property', 'og:title') ??
        null,
      description,
      location,
      images,
      sourceUrl: url,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scrape failed' },
      { status: 500 }
    );
  }
}
