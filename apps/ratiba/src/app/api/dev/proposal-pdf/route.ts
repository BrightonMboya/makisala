import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { createServerCaller } from '@/server/trpc/caller';
import { transformProposalToItineraryData } from '@/lib/proposal-transform';
import { renderProposalPdf } from '@/lib/pdf/proposal/render';
import { planImages } from '@/lib/pdf/proposal/document';
import { resolveImages } from '@/lib/pdf/proposal/images';
import { planAllDayPhotos } from '@/lib/pdf/proposal/helpers';
import { resolveDestinationPhotos } from '@/lib/pdf/proposal/destination-images';
import type { ItineraryData } from '@/types/itinerary-types';

/**
 * Dev tool for the react-pdf proposal document.
 *
 * Unlike /api/dev/pdf-benchmark, this renders in-process, so it works against a
 * local dev server with no Cloudflare token and no publicly reachable URL.
 *
 *   GET /api/dev/proposal-pdf?id=<proposalId>          -> stream the PDF
 *   GET /api/dev/proposal-pdf?id=<id>&json=1           -> timing + size only
 *   GET /api/dev/proposal-pdf?id=<id>&debug=1          -> per-day photo plan + image resolution
 *
 * In production the route requires ?key=<PDF_BENCHMARK_KEY>; locally it's open.
 */

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Report which of the document's images actually resolve.
 *
 * resolveImages() returns null for anything it can't fetch or transcode, by design:
 * one dead image must never fail a whole proposal. The cost is that a dropped photo
 * is indistinguishable from one that was never requested, and the page just renders
 * a placeholder. This names the ones that fell out.
 */
async function debugImages(data: ItineraryData) {
  const destinationPhotos = await resolveDestinationPhotos(data.itinerary);
  const plans = planAllDayPhotos(data, destinationPhotos, data.id);
  const requests = planImages(data, plans);

  const roles = new Map<string, string>();
  for (const { url, role } of requests) if (url && !roles.has(url)) roles.set(url, role);

  const book = await resolveImages(requests);

  return {
    resolved: `${book.size}/${roles.size}`,
    unresolved: [...roles]
      .filter(([url]) => !book.has(url))
      .map(([url, role]) => ({ url, role })),
    days: data.itinerary.map((day) => ({
      day: day.day,
      destination: day.destination,
      destinationId: day.destinationId ?? null,
      curatedPhotos: day.destinationId
        ? (destinationPhotos.get(day.destinationId)?.length ?? 0)
        : 0,
      accommodation: day.accommodation ?? null,
      plan: plans.get(day.day),
    })),
  };
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;

  if (process.env.NODE_ENV === 'production') {
    if (!env.PDF_BENCHMARK_KEY || params.get('key') !== env.PDF_BENCHMARK_KEY) {
      return new NextResponse('Not found', { status: 404 });
    }
  }

  const id = params.get('id');
  if (!id) return NextResponse.json({ error: 'missing ?id' }, { status: 400 });

  const lang = params.get('lang');

  const trpc = await createServerCaller();
  const proposal = await trpc.proposals.getById({ id });
  if (!proposal) return NextResponse.json({ error: 'proposal not found' }, { status: 404 });

  const language = lang || (proposal as { language?: string }).language || 'en';
  const translation =
    language === 'en' ? null : await trpc.translations.getTranslation({ proposalId: id, language });

  const data = transformProposalToItineraryData(proposal, translation);

  if (params.get('debug')) return NextResponse.json(await debugImages(data));

  const startedAt = Date.now();
  const pdf = await renderProposalPdf(data);
  const renderMs = Date.now() - startedAt;

  if (params.get('json')) {
    return NextResponse.json({ renderMs, bytes: pdf.byteLength, days: data.itinerary.length });
  }

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${data.title.replace(/[^\w\s-]/g, '')}.pdf"`,
      'X-Render-Ms': String(renderMs),
    },
  });
}
