import { NextResponse } from 'next/server';
import { db, member } from '@repo/db';
import { proposals } from '@repo/db/schema';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { log, serializeError } from '@/lib/logger';
import { getOrRenderProposalPdf } from '@/lib/pdf/proposal-pdf';

// The PDF is built in-process; the bulk of the time is fetching this proposal's
// images. maxDuration covers a photo-heavy itinerary on a cold cache.
export const maxDuration = 60;
export const runtime = 'nodejs';

// Resolve the caller's organization from the session, falling back to their first
// membership. Mirrors the send-email route.
async function getOrganizationId(
  session: Awaited<ReturnType<typeof auth.api.getSession>>,
): Promise<string | null> {
  if (!session?.user?.id) return null;

  if (session.session?.activeOrganizationId) {
    return session.session.activeOrganizationId as string;
  }

  const [membership] = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, session.user.id))
    .limit(1);

  return membership?.organizationId ?? null;
}

/**
 * Download the proposal as a PDF so the operator can send it directly (email,
 * WhatsApp, etc). Same render pipeline that attaches the PDF to the client email,
 * streamed back as an attachment instead.
 *
 *   GET /api/proposal/<id>/pdf
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const orgId = await getOrganizationId(session);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: proposalId } = await params;

    // Scope the lookup to the caller's org so one operator can't pull another's proposal.
    const proposal = await db.query.proposals.findFirst({
      where: and(eq(proposals.id, proposalId), eq(proposals.organizationId, orgId)),
    });

    if (!proposal) {
      return NextResponse.json({ success: false, error: 'Proposal not found' }, { status: 404 });
    }

    const title = proposal.tourTitle || proposal.name;
    const lang = (proposal as { language?: string }).language;

    // Serve a cached R2 copy when the proposal is unchanged since it was last
    // rendered (near-instant); otherwise render fresh and cache it.
    const { filename, pdf, source, renderMs } = await getOrRenderProposalPdf({
      id: proposalId,
      title,
      language: lang,
      updatedAt: proposal.updatedAt,
    });

    return new NextResponse(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdf.byteLength),
        'Cache-Control': 'no-store',
        // Observability: read these in the Network tab to see hit-vs-render + timing.
        'X-PDF-Source': source,
        'X-Render-Ms': String(renderMs),
      },
    });
  } catch (error) {
    log.error('Error generating proposal PDF for download', { error: serializeError(error) });
    await log.flush();
    return NextResponse.json({ success: false, error: 'Failed to generate PDF' }, { status: 500 });
  }
}
