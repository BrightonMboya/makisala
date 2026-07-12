import { NextResponse } from 'next/server';
import { db, member } from '@repo/db';
import { proposals } from '@repo/db/schema';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { log, serializeError } from '@/lib/logger';
import { getOrRenderProposalPdf } from '@/lib/pdf/proposal-pdf';
import { isCloudflareRenderConfigured } from '@/lib/pdf/cloudflare-render';

// Renders off-box on Cloudflare; maxDuration covers the round trip.
export const maxDuration = 60;

// Mirrors the download route's org resolution.
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
 * Warm the proposal PDF cache ahead of a Download / Send click.
 *
 * The share page fires this (fire-and-forget) once the proposal is published, so
 * the ~15s Cloudflare render happens while the operator reviews the page. By the
 * time they click, getOrRenderProposalPdf finds a fresh R2 copy and returns it
 * near-instantly. Rendering here is the same cache-populating call the download
 * uses, so a prewarm + a click never render twice for an unchanged proposal.
 *
 *   POST /api/proposal/<id>/pdf/prewarm
 */
export async function POST(
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

    const proposal = await db.query.proposals.findFirst({
      where: and(eq(proposals.id, proposalId), eq(proposals.organizationId, orgId)),
    });

    if (!proposal) {
      return NextResponse.json({ success: false, error: 'Proposal not found' }, { status: 404 });
    }

    if (!isCloudflareRenderConfigured()) {
      // Not an error the caller should act on — prewarming is best-effort.
      return NextResponse.json({ success: false, skipped: true });
    }

    const title = proposal.tourTitle || proposal.name;
    const lang = (proposal as { language?: string }).language;

    const { source, renderMs } = await getOrRenderProposalPdf({
      id: proposalId,
      title,
      language: lang,
      updatedAt: proposal.updatedAt,
    });

    return NextResponse.json({ success: true, source, renderMs });
  } catch (error) {
    log.error('Error prewarming proposal PDF', { error: serializeError(error) });
    await log.flush();
    return NextResponse.json({ success: false, error: 'Failed to prewarm PDF' }, { status: 500 });
  }
}
