import { NextResponse } from 'next/server';
import { withAxiom, type AxiomRequest } from 'next-axiom';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db, member } from '@repo/db';
import { and, eq } from 'drizzle-orm';
import { getOrgPlan } from '@/lib/plans';

export const GET = withAxiom(async (request: AxiomRequest) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization ID
    let orgId = session.session?.activeOrganizationId as string | undefined;

    // Verify the user is actually a member of this org
    if (orgId) {
      const [membership] = await db
        .select({ organizationId: member.organizationId })
        .from(member)
        .where(and(eq(member.userId, session.user.id), eq(member.organizationId, orgId)))
        .limit(1);
      if (!membership) {
        // User is not a member of the active org — fall back to their actual org
        orgId = undefined;
      }
    }

    if (!orgId) {
      const [membership] = await db
        .select({ organizationId: member.organizationId })
        .from(member)
        .where(eq(member.userId, session.user.id))
        .limit(1);
      orgId = membership?.organizationId ?? undefined;
    }

    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const plan = await getOrgPlan(orgId);
    if (!plan) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        tier: plan.tier,
        effectiveTier: plan.effectiveTier,
        isTrialing: plan.isTrialing,
        trialEndsAt: plan.trialEndsAt?.toISOString() ?? null,
        trialDaysRemaining: plan.trialDaysRemaining,
        limits: plan.limits,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
        },
      },
    );
  } catch (error) {
    request.log.error('Error fetching plan', { error: String(error) });
    if (error instanceof Error && error.message.includes('connect')) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
