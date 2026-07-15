import { NextResponse } from 'next/server';
import { withAxiom, type AxiomRequest } from 'next-axiom';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { db, member, recordSentEmail } from '@repo/db';
import { proposals, type EmailAttachment } from '@repo/db/schema';
import { and, eq } from 'drizzle-orm';
import { resend, orgFromAddress } from '@repo/resend';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { env } from '@/lib/env';
import { serializeError } from '@/lib/logger';
import { getOrRenderProposalPdf } from '@/lib/pdf/proposal-pdf';
import { substituteProposalEmailHtml } from '@/lib/email/render-proposal-email';
import { renderLegacyProposalEmail } from '@/lib/email/legacy-proposal-email';
import { r2 } from '@/lib/storage';

// Resend caps a message at ~40MB (after encoding). The proposal PDF and any
// operator attachments share that budget, so we stop adding files once the raw
// total approaches the ceiling and log what was dropped.
const MAX_TOTAL_ATTACHMENT_BYTES = 38 * 1024 * 1024;

// Fetch one stored attachment from R2 as a Buffer for Resend. Best-effort: a
// missing/unreadable object is skipped rather than failing the whole send.
async function fetchAttachment(
  a: EmailAttachment,
): Promise<{ filename: string; content: Buffer } | null> {
  try {
    const res = await r2.send(
      new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: a.key }),
    );
    if (!res.Body) return null;
    const bytes = await res.Body.transformToByteArray();
    return { filename: a.filename, content: Buffer.from(bytes) };
  } catch {
    return null;
  }
}

// The PDF is rendered on Cloudflare Browser Rendering (an off-box HTTP call, no
// in-lambda Chromium), so we just wait on the response; maxDuration covers that
// round trip.
export const maxDuration = 60;

// Helper to get organization ID from session or member table
async function getOrganizationId(session: Awaited<ReturnType<typeof auth.api.getSession>>): Promise<string | null> {
  if (!session?.user?.id) return null;

  // First try session's activeOrganizationId (set by Better Auth organization plugin)
  if (session.session?.activeOrganizationId) {
    return session.session.activeOrganizationId as string;
  }

  // Fallback: look up user's first organization from member table
  const [membership] = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, session.user.id))
    .limit(1);

  return membership?.organizationId ?? null;
}

export const POST = withAxiom(async (request: AxiomRequest) => {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    const orgId = await getOrganizationId(session);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { proposalId, recipientEmail, recipientName, subject, message, isTest, bodyHtml } = body;

    if (!proposalId || !recipientEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Fetch proposal data, scoped to user's organization
    const proposal = await db.query.proposals.findFirst({
      where: and(
        eq(proposals.id, proposalId),
        eq(proposals.organizationId, orgId),
      ),
      with: {
        organization: true,
        days: true,
      },
    });

    if (!proposal) {
      return NextResponse.json({ success: false, error: 'Proposal not found' }, { status: 404 });
    }

    // Calculate duration
    const duration = proposal.days?.length > 0 ? `${proposal.days.length} days` : undefined;

    // Format start date
    const startDate = proposal.startDate
      ? new Date(proposal.startDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : undefined;

    const proposalUrl = `${env.NEXT_PUBLIC_APP_URL}/proposal/${proposalId}`;
    const agencyName = proposal.organization?.name || 'Your Travel Agency';
    const proposalTitle = proposal.tourTitle || proposal.name;

    // The operator composes the body in the `@react-email/editor` composer on
    // /share, which renders it to HTML (with {{variable}} tokens) and posts that
    // as `bodyHtml`. We substitute this proposal's real values so the send
    // matches the preview exactly. When no composed HTML is posted we fall back
    // to the static template.
    const clientName = recipientName || 'Valued Traveler';
    const variables = { clientName, agencyName, proposalTitle, proposalUrl, startDate, duration };
    const html =
      typeof bodyHtml === 'string' && bodyHtml.trim().length > 0
        ? substituteProposalEmailHtml(bodyHtml, variables)
        : renderLegacyProposalEmail({ ...variables, message: message || undefined, isTest });

    const fromEmail = orgFromAddress({
      name: proposal.organization?.name,
      slug: proposal.organization?.slug,
    });
    const replyToEmail = proposal.organization?.notificationEmail ?? undefined;

    // Render a PDF copy of the proposal to attach alongside the live link, via
    // Cloudflare Browser Rendering (off-box). This is best-effort: a render hiccup
    // should never block the send, since the email's primary CTA is the online
    // proposal. On failure we log and send without the attachment.
    const lang = (proposal as { language?: string }).language;
    let pdfAttachment: { filename: string; content: Buffer } | undefined;
    try {
      // Reuses the R2-cached copy when the share page prewarmed it, so a send
      // right after publishing is near-instant instead of a fresh ~15s render.
      const { filename, pdf } = await getOrRenderProposalPdf({
        id: proposalId,
        title: proposalTitle,
        language: lang,
        updatedAt: proposal.updatedAt,
      });
      pdfAttachment = { filename, content: Buffer.from(pdf) };
    } catch (error) {
      request.log.error('Failed to render proposal PDF for email attachment; sending without it', {
        proposalId,
        error: serializeError(error),
      });
    }

    // Assemble the final attachment list: the proposal PDF first, then any files
    // the operator added on /share (fetched from R2). Stay under Resend's size
    // ceiling by dropping files once the running total would exceed it.
    const attachments: Array<{ filename: string; content: Buffer }> = [];
    let totalBytes = 0;
    if (pdfAttachment) {
      attachments.push(pdfAttachment);
      totalBytes += pdfAttachment.content.length;
    }
    const extraAttachments = (proposal.emailAttachments as EmailAttachment[] | null) ?? [];
    for (const meta of extraAttachments) {
      const fetched = await fetchAttachment(meta);
      if (!fetched) {
        request.log.warn('Skipping unreadable email attachment', { proposalId, key: meta.key });
        continue;
      }
      if (totalBytes + fetched.content.length > MAX_TOTAL_ATTACHMENT_BYTES) {
        request.log.warn('Attachment exceeds size budget; skipping', {
          proposalId,
          filename: fetched.filename,
        });
        continue;
      }
      attachments.push(fetched);
      totalBytes += fetched.content.length;
    }

    const result = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: subject || `Your Travel Proposal: ${proposalTitle}`,
      html,
      ...(replyToEmail ? { replyTo: replyToEmail } : {}),
      ...(attachments.length > 0 ? { attachments } : {}),
    });

    if (result.error) {
      request.log.error('Resend API error', { error: serializeError(result.error) });
      return NextResponse.json(
        { success: false, error: result.error.message || 'Failed to send email' },
        { status: 500 },
      );
    }

    // Log real sends for delivery analytics. Test emails are excluded so the
    // timeline reflects only what the client actually received. Best-effort:
    // a logging failure must not fail the send.
    if (!isTest && result.data?.id) {
      try {
        await recordSentEmail(db, {
          resendId: result.data.id,
          type: 'proposal_share',
          toEmail: recipientEmail,
          subject: subject || `Your Travel Proposal: ${proposalTitle}`,
          organizationId: orgId,
          proposalId,
        });
      } catch (error) {
        request.log.error('Failed to log proposal email send', {
          proposalId,
          error: serializeError(error),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    request.log.error('Error sending proposal email', { error: serializeError(error) });
    await request.log.flush();
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
  }
});
