import 'server-only';
import { env } from '@/lib/env';

/**
 * Proposal-PDF render via Cloudflare Browser Rendering's REST `/pdf` quick action.
 *
 * This is the "give us a URL, get a PDF back" model: Cloudflare's managed Chrome
 * fetches the print route over the public internet and prints it. We get NO hook to
 * run per-page fixes, which is why the print route is built to be printable-by-
 * construction: the route map is a static Mapbox raster (StaticTripMap), not WebGL,
 * so nothing needs rasterizing remotely. We still inject a best-effort priming
 * script (force images eager + scroll pass) and a settle delay so lazy `next/image`
 * and framer-motion reveals finish before capture.
 *
 * The target URL must be PUBLICLY reachable — Cloudflare's cloud browser cannot
 * see `localhost`. Point it at a deployed proposal print URL.
 */

// Desktop-width canvas at A4 aspect (1 : 1.414), matching the print route's @page.
const PAGE_WIDTH = 1280;
const PAGE_HEIGHT = Math.round(PAGE_WIDTH * 1.4142); // 1810

// Best-effort in-page priming. Cloudflare injects this after navigation; combined
// with waitForTimeout below it forces lazy `next/image` to load before capture.
const PRIMING_SCRIPT = `
  document.documentElement.style.scrollBehavior = 'auto';
  document.querySelectorAll('img').forEach((img) => {
    img.loading = 'eager';
    if ('fetchPriority' in img) img.fetchPriority = 'high';
  });
  (async () => {
    const step = window.innerHeight;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 25));
    }
    window.scrollTo(0, 0);
  })();
`;

export type CloudflareRenderResult = {
  pdf: Uint8Array;
  /** Wall-clock time from request start to full response body, in ms. */
  ms: number;
};

export type CloudflareRenderOptions = {
  /** Extra settle time (ms) after navigation for lazy images to load. */
  waitMs?: number;
};

function endpoint(accountId: string): string {
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/pdf`;
}

export function isCloudflareRenderConfigured(): boolean {
  return !!env.R2_ACCOUNT_ID && !!env.CLOUDFLARE_BROWSER_RENDERING_TOKEN;
}

/**
 * Render a publicly-reachable print URL to a PDF via Cloudflare. Throws with the
 * response body on any non-2xx (Cloudflare returns JSON errors, binary PDF on OK).
 */
export async function renderProposalPdfViaCloudflare(
  url: string,
  opts: CloudflareRenderOptions = {},
): Promise<CloudflareRenderResult> {
  const accountId = env.R2_ACCOUNT_ID;
  const token = env.CLOUDFLARE_BROWSER_RENDERING_TOKEN;
  if (!accountId || !token) {
    throw new Error(
      'Cloudflare Browser Rendering not configured (need CLOUDFLARE_BROWSER_RENDERING_TOKEN)',
    );
  }

  const body = {
    url,
    // The themes are screen-designed; pagination comes from the @page rule.
    emulateMediaType: 'screen',
    viewport: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
    // `load` (not `networkidle0`): analytics and other beacons keep the network from
    // ever going idle, so networkidle0 rides until the session drops (Cloudflare
    // error 5006). `load` waits for images and subresources; the settle delay below
    // covers late lazy loads.
    gotoOptions: { waitUntil: 'load', timeout: 30_000 },
    addScriptTag: [{ content: PRIMING_SCRIPT }],
    waitForTimeout: opts.waitMs ?? 4_000,
    pdfOptions: {
      printBackground: true,
      preferCSSPageSize: true, // honor the print route's @page 1280x1810 size
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    },
  };

  const startedAt = performance.now();
  const res = await fetch(endpoint(accountId), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const contentType = res.headers.get('content-type') ?? '';
  if (!res.ok || contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cloudflare /pdf failed: ${res.status} ${res.statusText} ${text.slice(0, 600)}`);
  }

  const pdf = new Uint8Array(await res.arrayBuffer());
  return { pdf, ms: Math.round(performance.now() - startedAt) };
}
