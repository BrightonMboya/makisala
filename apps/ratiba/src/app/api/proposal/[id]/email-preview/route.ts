import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db, member } from '@repo/db';
import { proposals } from '@repo/db/schema';
import { auth } from '@/lib/auth';
import { env } from '@/lib/env';
import { substituteProposalEmailHtml } from '@/lib/email/render-proposal-email';
import { renderLegacyProposalEmail } from '@/lib/email/legacy-proposal-email';

// Substitutes this proposal's real variables (client name, dates, link) into the
// email HTML the composer rendered, producing the exact HTML the client will
// receive. Powers the Preview tab on /share. POST body: { bodyHtml } — the
// current editor's rendered HTML (with {{tokens}}); omit it to fall back to the
// static template.
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

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: proposalId } = await ctx.params;
  const session = await auth.api.getSession({ headers: req.headers });
  const orgId = await getOrganizationId(session);
  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const proposal = await db.query.proposals.findFirst({
    where: and(eq(proposals.id, proposalId), eq(proposals.organizationId, orgId)),
    with: {
      organization: { columns: { name: true } },
      client: { columns: { name: true } },
      days: { columns: { id: true } },
    },
  });
  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  const { bodyHtml } = (await req.json().catch(() => ({}))) as { bodyHtml?: string };

  const duration = proposal.days.length > 0 ? `${proposal.days.length} days` : undefined;
  const startDate = proposal.startDate
    ? new Date(proposal.startDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : undefined;

  const variables = {
    clientName: proposal.client?.name || 'Valued Traveler',
    agencyName: proposal.organization?.name || 'Your Travel Agency',
    proposalTitle: proposal.tourTitle || proposal.name,
    proposalUrl: `${env.NEXT_PUBLIC_APP_URL}/proposal/${proposalId}`,
    startDate,
    duration,
  };

  // Substitute the composer's rendered HTML; fall back to the static template
  // when the page hasn't posted any (e.g. an empty composer).
  const html =
    bodyHtml && bodyHtml.trim().length > 0
      ? substituteProposalEmailHtml(bodyHtml, variables)
      : renderLegacyProposalEmail(variables);

  return NextResponse.json({ html });
}
