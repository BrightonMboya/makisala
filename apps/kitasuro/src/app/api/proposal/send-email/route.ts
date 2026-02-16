import { NextResponse } from 'next/server';
import { withAxiom, type AxiomRequest } from 'next-axiom';
import { db, member } from '@repo/db';
import { proposals } from '@repo/db/schema';
import { and, eq } from 'drizzle-orm';
import { resend } from '@repo/resend';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { env } from '@/lib/env';

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
    const { proposalId, recipientEmail, recipientName, subject, message, isTest } = body;

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

    // Render email HTML
    const html = renderProposalEmail({
      clientName: recipientName || 'Valued Traveler',
      agencyName,
      proposalTitle: proposal.tourTitle || proposal.name,
      proposalUrl,
      startDate,
      duration,
      message: message || undefined,
      isTest,
    });

    // Send email
    const fromEmail = env.RESEND_FROM_EMAIL;

    const result = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: subject || `Your Travel Proposal: ${proposal.tourTitle || proposal.name}`,
      html,
    });

    if (result.error) {
      request.log.error('Resend API error', { error: result.error });
      return NextResponse.json(
        { success: false, error: result.error.message || 'Failed to send email' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    request.log.error('Error sending proposal email', { error: String(error) });
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
  }
});

interface EmailProps {
  clientName: string;
  agencyName: string;
  proposalTitle: string;
  proposalUrl: string;
  startDate?: string;
  duration?: string;
  message?: string;
  isTest?: boolean;
}

function escapeHtml(text: string | undefined): string {
  if (!text) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] ?? m);
}

function renderProposalEmail(props: EmailProps): string {
  const {
    clientName,
    agencyName,
    proposalTitle,
    proposalUrl,
    startDate,
    duration,
    message,
    isTest,
  } = props;

  // Convert message line breaks to HTML
  const formattedMessage = message
    ? escapeHtml(message)
        .replace(/\n\n/g, '</p><p style="margin-bottom: 16px;">')
        .replace(/\n/g, '<br />')
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Travel Proposal</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  ${
    isTest
      ? `
  <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; text-align: center;">
    <strong style="color: #92400e;">TEST EMAIL</strong>
    <span style="color: #78716c;"> - This is a preview of how your email will look</span>
  </div>
  `
      : ''
  }

  <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <!-- Greeting -->
    <p style="font-size: 16px; margin-bottom: 20px;">
      Dear <strong>${escapeHtml(clientName)}</strong>,
    </p>

    <!-- Custom Message -->
    ${
      formattedMessage
        ? `
    <div style="margin-bottom: 25px;">
      <p style="margin-bottom: 16px;">${formattedMessage}</p>
    </div>
    `
        : `
    <p style="font-size: 16px; margin-bottom: 20px;">
      Thank you for choosing ${escapeHtml(agencyName)} to plan your unforgettable journey! We've carefully crafted this personalized travel proposal based on your preferences and dreams.
    </p>
    <p style="font-size: 16px; margin-bottom: 25px;">
      Inside, you'll find a detailed day-by-day itinerary, handpicked accommodations, exciting activities, and transparent pricing. We've poured our expertise and passion into creating an experience you'll cherish forever.
    </p>
    `
    }

    <!-- Proposal Card -->
    <div style="background-color: #f8f9fa; border-left: 4px solid #15803d; padding: 24px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
      <h2 style="margin: 0 0 12px 0; font-size: 22px; color: #1a1a1a; font-family: Georgia, serif;">
        ${escapeHtml(proposalTitle)}
      </h2>
      ${
        startDate
          ? `
      <p style="margin: 6px 0; font-size: 14px; color: #525252;">
        <strong style="color: #737373;">Start Date:</strong> ${escapeHtml(startDate)}
      </p>
      `
          : ''
      }
      ${
        duration
          ? `
      <p style="margin: 6px 0; font-size: 14px; color: #525252;">
        <strong style="color: #737373;">Duration:</strong> ${escapeHtml(duration)}
      </p>
      `
          : ''
      }
    </div>

    <!-- CTA Button -->
    <div style="margin: 35px 0; text-align: center;">
      <a href="${escapeHtml(proposalUrl)}" style="display: inline-block; background-color: #15803d; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(21, 128, 61, 0.3);">
        View Your Proposal
      </a>
    </div>

    <!-- Additional Info -->
    <div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 25px;">
      <p style="font-size: 14px; color: #166534; margin: 0;">
        <strong>Have questions?</strong> Simply leave a comment directly on your proposal. We're here to make your trip absolutely perfect!
      </p>
    </div>

    <!-- Divider -->
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 25px 0;" />

    <!-- Footer -->
    <p style="font-size: 14px; color: #666; margin: 0;">
      We can't wait to help you embark on this adventure!
    </p>
    <p style="font-size: 14px; color: #666; margin-top: 15px;">
      Warm regards,<br />
      <strong style="color: #333;">${escapeHtml(agencyName)}</strong>
    </p>

    <!-- Legal Footer -->
    <p style="margin-top: 35px; font-size: 11px; color: #999999; text-align: center; padding-top: 20px; border-top: 1px solid #f0f0f0;">
      This email was sent by ${escapeHtml(agencyName)}. If you did not request this proposal, please ignore this email.
    </p>
  </div>
</body>
</html>
  `.trim();
}
