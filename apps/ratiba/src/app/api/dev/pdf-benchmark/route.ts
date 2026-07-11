import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { renderProposalPdf } from '@/lib/pdf/generate-pdf';
import {
  renderProposalPdfViaCloudflare,
  isCloudflareRenderConfigured,
} from '@/lib/pdf/cloudflare-render';

/**
 * Dev-only A/B harness for proposal-PDF rendering. Runs the current puppeteer
 * path and Cloudflare Browser Rendering's REST /pdf against the same proposal and
 * reports wall-clock time + byte size so we can compare speed and output quality.
 *
 *   GET /api/dev/pdf-benchmark?id=<proposalId>              -> JSON with both timings
 *   GET /api/dev/pdf-benchmark?id=<id>&download=cf          -> stream the CF PDF
 *   GET /api/dev/pdf-benchmark?id=<id>&download=current     -> stream the puppeteer PDF
 *
 * Extra params: theme, lang, run=both|cf|current, wait=<ms> (CF settle delay),
 * url=<publicPrintUrl> (override; CF cannot reach localhost so on local dev pass a
 * deployed print URL here to exercise CF).
 *
 * In production the route requires ?key=<PDF_BENCHMARK_KEY>; locally it's open.
 */

export const runtime = 'nodejs';
export const maxDuration = 60;

type Engine = 'current' | 'cf';

type EngineResult = {
  ok: boolean;
  ms: number | null;
  bytes: number | null;
  error?: string;
};

function printUrl(id: string, theme: string | null, lang: string | null): string {
  const u = new URL(`/proposal/${id}/print`, env.NEXT_PUBLIC_APP_URL);
  if (theme) u.searchParams.set('theme', theme);
  if (lang) u.searchParams.set('lang', lang);
  return u.toString();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = url.searchParams;

  // Guard: production requires the shared key; non-prod is open for convenience.
  if (process.env.NODE_ENV === 'production') {
    if (!env.PDF_BENCHMARK_KEY || params.get('key') !== env.PDF_BENCHMARK_KEY) {
      return new NextResponse('Not found', { status: 404 });
    }
  }

  const idParam = params.get('id');
  if (!idParam) {
    return NextResponse.json({ error: 'Missing ?id=<proposalId>' }, { status: 400 });
  }
  const id: string = idParam;

  const theme = params.get('theme');
  const lang = params.get('lang');
  const run = (params.get('run') ?? 'both') as 'both' | Engine;
  const download = params.get('download') as Engine | null;
  const waitMs = params.get('wait') ? Number(params.get('wait')) : undefined;
  // CF needs a publicly reachable URL; allow overriding the derived one.
  const cfUrl = params.get('url') ?? printUrl(id, theme, lang);

  // Keep the two PDF buffers around so ?download= can stream one back.
  let currentPdf: Uint8Array | null = null;
  let cfPdf: Uint8Array | null = null;

  async function runCurrent(): Promise<EngineResult> {
    const t0 = performance.now();
    try {
      currentPdf = await renderProposalPdf({
        id,
        theme: theme ?? undefined,
        lang: lang ?? undefined,
      });
      return { ok: true, ms: Math.round(performance.now() - t0), bytes: currentPdf.byteLength };
    } catch (err) {
      return {
        ok: false,
        ms: Math.round(performance.now() - t0),
        bytes: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async function runCf(): Promise<EngineResult> {
    if (!isCloudflareRenderConfigured()) {
      return { ok: false, ms: null, bytes: null, error: 'Cloudflare not configured' };
    }
    try {
      const { pdf, ms } = await renderProposalPdfViaCloudflare(cfUrl, { waitMs });
      cfPdf = pdf;
      return { ok: true, ms, bytes: pdf.byteLength };
    } catch (err) {
      return {
        ok: false,
        ms: null,
        bytes: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // Run sequentially so the two engines don't contend for CPU/network and skew
  // each other's timing.
  const results: { current?: EngineResult; cf?: EngineResult } = {};
  if (run === 'both' || run === 'current') results.current = await runCurrent();
  if (run === 'both' || run === 'cf') results.cf = await runCf();

  if (download) {
    const buf = download === 'cf' ? cfPdf : currentPdf;
    if (!buf) {
      return NextResponse.json(
        { error: `No PDF for engine "${download}"`, results },
        { status: 502 },
      );
    }
    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${download}-${id}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  return NextResponse.json({
    proposalId: id,
    cfUrl,
    localhostWarning: /localhost|127\.0\.0\.1/.test(cfUrl)
      ? 'Cloudflare cannot reach localhost; pass ?url=<deployed print URL> to test CF.'
      : undefined,
    results,
  });
}
