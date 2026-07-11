import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import {
  renderProposalPdfViaCloudflare,
  isCloudflareRenderConfigured,
} from '@/lib/pdf/cloudflare-render';

/**
 * Dev-only tool to render a proposal PDF via Cloudflare Browser Rendering and
 * inspect it, wall-clock time + byte size, or download the file itself.
 *
 *   GET /api/dev/pdf-benchmark?id=<proposalId>         -> JSON with timing + size
 *   GET /api/dev/pdf-benchmark?id=<id>&download=1      -> stream the PDF
 *
 * Extra params: theme, lang, wait=<ms> (CF settle delay), url=<publicPrintUrl>
 * (override; CF cannot reach localhost, so on local dev pass a deployed print URL).
 *
 * In production the route requires ?key=<PDF_BENCHMARK_KEY>; locally it's open.
 */

export const runtime = 'nodejs';
export const maxDuration = 60;

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

  const id = params.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing ?id=<proposalId>' }, { status: 400 });
  }

  if (!isCloudflareRenderConfigured()) {
    return NextResponse.json({ error: 'Cloudflare Browser Rendering not configured' }, { status: 503 });
  }

  const theme = params.get('theme');
  const lang = params.get('lang');
  const download = params.get('download');
  const waitMs = params.get('wait') ? Number(params.get('wait')) : undefined;
  // CF needs a publicly reachable URL; allow overriding the derived one.
  const cfUrl = params.get('url') ?? printUrl(id, theme, lang);

  let pdf: Uint8Array;
  let ms: number;
  try {
    ({ pdf, ms } = await renderProposalPdfViaCloudflare(cfUrl, { waitMs }));
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
        cfUrl,
        localhostWarning: /localhost|127\.0\.0\.1/.test(cfUrl)
          ? 'Cloudflare cannot reach localhost; pass ?url=<deployed print URL> to test CF.'
          : undefined,
      },
      { status: 502 },
    );
  }

  if (download) {
    return new NextResponse(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="cf-${id}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  return NextResponse.json({ proposalId: id, cfUrl, ms, bytes: pdf.byteLength });
}
