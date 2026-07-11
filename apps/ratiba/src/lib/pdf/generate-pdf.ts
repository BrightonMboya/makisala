import 'server-only';
import type { Browser } from 'puppeteer-core';
import puppeteer from 'puppeteer-core';
import { env } from '@/lib/env';
import { withTimeout } from '@/lib/with-timeout';

/**
 * Headless-Chromium proposal renderer.
 *
 * We do NOT rebuild the themes in a PDF DSL. Instead we point a real Chromium at
 * the print route (`/proposal/[id]/print`), which renders the *actual* theme
 * component, and print it to PDF. That is the only path that yields a pixel-exact
 * replica of the on-screen design (Tailwind, custom fonts, images, gradients).
 *
 * Prod (Vercel): puppeteer-core + @sparticuz/chromium (fits the 250MB fn limit).
 * Local: puppeteer-core driving the machine's installed Chrome.
 */

// Desktop-width canvas so the PDF matches what the operator sees on screen,
// not a reflowed mobile layout. Height is A4 aspect (1 : 1.414) at that width.
const PAGE_WIDTH = 1280;
const PAGE_HEIGHT = Math.round(PAGE_WIDTH * 1.4142); // 1810

// Largest edge (px) we let any embedded image keep. The themes are full-bleed at
// 1280px wide, so 1600px is already retina-sharp for print; the raw originals
// (unoptimized phone photos, 4000px+ Unsplash) are what balloon the file to 60MB.
const MAX_IMAGE_DIM = 1600;
const JPEG_QUALITY = 0.82;

const isServerless = !!process.env.VERCEL;

function localChromePath(): string {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  switch (process.platform) {
    case 'darwin':
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    case 'win32':
      return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    default:
      return '/usr/bin/google-chrome';
  }
}

// Chrome's Opaque Response Blocking (ORB) blocks some cross-origin images —
// notably Supabase storage objects, whose headers trip it — with ERR_BLOCKED_BY_ORB,
// leaving them blank in the PDF. This is a trusted server-side render of our own
// proposal, so we turn the protection off to let every image origin load.
const IMAGE_LOADING_ARGS = ['--disable-web-security', '--disable-features=OpaqueResponseBlocking'];

async function launchBrowser(): Promise<Browser> {
  if (isServerless) {
    // Loaded lazily so local dev never touches the serverless binary.
    const chromium = (await import('@sparticuz/chromium')).default;
    return puppeteer.launch({
      args: [...chromium.args, ...IMAGE_LOADING_ARGS],
      executablePath: await chromium.executablePath(),
      headless: true,
      // deviceScaleFactor 1: text prints as vector (crisp at any scale), so 2x only
      // inflated the raster of images/maps and bloated the file for no real gain.
      defaultViewport: { width: PAGE_WIDTH, height: PAGE_HEIGHT, deviceScaleFactor: 1 },
    });
  }

  return puppeteer.launch({
    executablePath: localChromePath(),
    headless: true,
    args: ['--no-sandbox', '--font-render-hinting=none', ...IMAGE_LOADING_ARGS],
    defaultViewport: { width: PAGE_WIDTH, height: PAGE_HEIGHT, deviceScaleFactor: 2 },
  });
}

/**
 * Scroll the whole page top-to-bottom to trigger lazy images and framer-motion
 * `whileInView` reveals, then return to the top so scroll-linked hero effects
 * (which fade/parallax as you scroll away) render in their initial state.
 * Finally, wait for every <img> to finish loading so nothing captures half-loaded.
 */
async function primeLazyContent(page: import('puppeteer-core').Page): Promise<void> {
  await page.evaluate(async () => {
    // Deterministic priming: kill smooth-scroll so each step lands instantly.
    const scrollFix = document.createElement('style');
    scrollFix.textContent = '*{scroll-behavior:auto !important;}';
    document.head.appendChild(scrollFix);

    // next/image defaults to loading="lazy", so images below the fold never
    // start fetching until scrolled into view — and the scroll pass below can
    // outrun them. Flip every image to eager+high-priority up front so they
    // are already in flight by the time we wait on them. This is the main fix
    // for images that render blank or half-loaded "sometimes".
    document.querySelectorAll('img').forEach((img) => {
      img.loading = 'eager';
      if ('fetchPriority' in img) (img as HTMLImageElement).fetchPriority = 'high';
    });

    await new Promise<void>((resolve) => {
      let y = 0;
      // A full-viewport step at a tight interval: we've already flipped every
      // image to eager/high-priority above, so this pass exists only to trip
      // framer `whileInView` reveals — it doesn't need to inch down the page.
      const step = window.innerHeight;
      const timer = setInterval(() => {
        window.scrollTo(0, y);
        y += step;
        if (y >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 25);
    });
    window.scrollTo(0, 0);
    // Let the last reveals settle.
    await new Promise((r) => setTimeout(r, 150));

    // Wait for every image to both finish loading AND decode (a loaded-but-not-
    // yet-decoded image can still capture blank). Hard cap so a broken src or a
    // slow origin can't hang the whole render.
    await Promise.race([
      Promise.all(
        Array.from(document.images).map(async (img) => {
          try {
            if (!img.complete) {
              await new Promise<void>((res) => {
                img.addEventListener('load', () => res(), { once: true });
                img.addEventListener('error', () => res(), { once: true });
              });
            }
            if (img.decode) await img.decode().catch(() => {});
          } catch {
            /* never let one image block the capture */
          }
        }),
      ),
      new Promise((r) => setTimeout(r, 15000)),
    ]);
  });
}

/**
 * Downscale every oversized <img> in place before printing. next/image is set to
 * `unoptimized`, so the browser fetches the raw originals and Chromium embeds them
 * at full resolution — the single biggest driver of a bloated PDF. We redraw each
 * large image onto a canvas capped at MAX_IMAGE_DIM and swap in a JPEG data URL, so
 * Chromium embeds the small version instead.
 *
 * `--disable-web-security` (already set for image loading) keeps cross-origin draws
 * from tainting the canvas, so toDataURL succeeds for Supabase/Unsplash/R2 images.
 * Anything that still can't be read (or is already small) is left untouched.
 */
async function downscaleImages(page: import('puppeteer-core').Page): Promise<void> {
  await page.evaluate(
    async (maxDim, quality) => {
      const imgs = Array.from(document.images);
      for (const img of imgs) {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) continue;
        const scale = maxDim / Math.max(w, h);
        if (scale >= 1) continue; // already small enough — leave it (keeps PNG alpha too)
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(w * scale);
          canvas.height = Math.round(h * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          if (dataUrl.startsWith('data:image/jpeg')) {
            img.removeAttribute('srcset'); // stop the browser re-picking the full-res source
            img.src = dataUrl;
          }
        } catch {
          /* tainted or unreadable — keep the original */
        }
      }
      // Let the swapped-in data URLs decode before we capture.
      await Promise.all(imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : null)));
    },
    MAX_IMAGE_DIM,
    JPEG_QUALITY,
  );
}

/**
 * The route map is a MapLibre (WebGL) canvas. Two things make it print blank:
 *
 *  1. Chromium's print-to-PDF path (`page.pdf()`) does not rasterize live WebGL
 *     canvases — it captures the DOM (markers, attribution) but the tile canvas
 *     comes out empty. `page.screenshot()` / element screenshots DO capture WebGL
 *     because they read the composited surface.
 *  2. An off-screen canvas gets render-throttled, so it may not have a fresh frame
 *     when we capture (mitigated by `preserveDrawingBuffer` on the map, which keeps
 *     the last frame around).
 *
 * So we flatten every map to a static PNG before printing: wait for it to paint,
 * screenshot the element (reliable WebGL capture), and swap the live canvas for an
 * <img> of that snapshot. `page.pdf()` then embeds the image like any other.
 *
 * Best-effort throughout: a proposal with no map, a slow map, or a screenshot
 * failure just leaves the live element in place and never blocks the render.
 */
async function rasterizeMaps(page: import('puppeteer-core').Page): Promise<void> {
  const handles = await page.$$('[data-print-map]');
  if (handles.length === 0) return;

  // Wait for the DefaultLoader (animate-pulse dots) to clear on all maps, i.e. the
  // style + tiles have loaded. Best-effort: a slow/failed map won't block forever.
  await page
    .waitForFunction(
      () => !document.querySelector('[data-print-map] .animate-pulse'),
      { timeout: 12_000, polling: 300 },
    )
    .catch(() => {});

  for (const handle of handles) {
    try {
      // Only WebGL maps have a canvas; the WebGL-failed fallback is plain DOM and
      // prints fine as-is, so leave it untouched.
      const hasCanvas = await handle.evaluate((el) => !!el.querySelector('canvas'));
      if (!hasCanvas) continue;

      // element.screenshot() scrolls the map into view, which also wakes a
      // throttled off-screen canvas; give the tiles a beat to paint a fresh frame.
      await handle.scrollIntoView().catch(() => {});
      await page.evaluate(() => new Promise((r) => setTimeout(r, 600)));

      const base64 = (await handle.screenshot({ encoding: 'base64', type: 'png' })) as string;

      // Replace the live map (canvas + controls) with the flat snapshot. The map's
      // sibling label ("ROUTE MAP") lives outside [data-print-map], so it stays.
      await handle.evaluate((el, dataUrl) => {
        const img = document.createElement('img');
        img.src = `data:image/png;base64,${dataUrl}`;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
        el.replaceChildren(img);
      }, base64);
    } catch {
      /* leave the live map in place — never block the render on one map */
    } finally {
      await handle.dispose();
    }
  }
}

export type RenderProposalPdfOptions = {
  id: string;
  theme?: string;
  lang?: string;
};

// Overall wall-clock ceiling for a single render. Callers (e.g. the send-email
// route) run this inside a ~60s serverless budget. If Chromium hangs — a slow
// print page, a stuck image origin, a heavy proposal — we MUST abort well before
// the platform hard-kills the whole function: that kill is uncatchable, skips our
// try/catch and log flush, and returns a non-JSON error page that breaks the
// caller. On timeout we reject cleanly so the caller can log and, since the PDF
// is best-effort, still send the email without the attachment.
const RENDER_BUDGET_MS = 40_000;

export async function renderProposalPdf(opts: RenderProposalPdfOptions): Promise<Uint8Array> {
  const { id, theme, lang } = opts;

  const url = new URL(`/proposal/${id}/print`, env.NEXT_PUBLIC_APP_URL);
  if (theme) url.searchParams.set('theme', theme);
  if (lang) url.searchParams.set('lang', lang);

  const browser = await launchBrowser();
  try {
    return await withTimeout(renderWithBrowser(browser, url), RENDER_BUDGET_MS, 'PDF render');
  } finally {
    // Always tear down Chromium, including on timeout — closing the browser also
    // rejects any page operation still pending from the aborted render, so nothing
    // is left running to keep eating the function's budget.
    await browser.close().catch(() => {});
  }
}

async function renderWithBrowser(browser: Browser, url: URL): Promise<Uint8Array> {
  const page = await browser.newPage();
  // Render with screen styles (the themes are screen-designed); pagination is
  // still driven by the @page rule the print route sets.
  await page.emulateMediaType('screen');
  // `domcontentloaded` (not `networkidle0`): in dev the HMR websocket keeps a
  // connection open so networkidle never settles, and the persistent socket can
  // detach the navigating frame. We wait for images/fonts explicitly instead.
  // Cap goto below the overall budget so navigation alone can't consume it.
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 30_000 });

  await primeLazyContent(page);

  // Flatten the WebGL route map to a static image (page.pdf can't capture live
  // WebGL). Must run after priming (which scrolls the map into view to paint).
  await rasterizeMaps(page);

  // Shrink oversized images to keep the PDF small (must run after they've loaded).
  await downscaleImages(page);

  // Belt-and-suspenders: force anything framer-motion left mid-animation into
  // its visible end-state. We only touch inline opacity/transform that motion
  // sets, so Tailwind-driven opacity on overlays is untouched.
  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>('[style]').forEach((el) => {
      const op = el.style.opacity;
      if (op !== '' && parseFloat(op) < 1) el.style.opacity = '1';
      const tf = el.style.transform;
      if (tf && /translate|scale/.test(tf)) el.style.transform = 'none';
    });
  });

  // Wait for web fonts, then for the print page's readiness signal (best-effort).
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
  await page
    .waitForFunction(() => (window as unknown as { __PRINT_READY__?: boolean }).__PRINT_READY__ === true, {
      timeout: 4_000,
    })
    .catch(() => {});

  const pdf = await page.pdf({
    printBackground: true,
    preferCSSPageSize: true, // honor the @page size from the print route
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });

  return new Uint8Array(pdf);
}
