/**
 * Server-only billing reconciliation.
 *
 * Treats Polar as the source of truth for an organization's plan tier, rather
 * than relying solely on webhook delivery. Webhooks update `organizations.plan_tier`
 * on the happy path, but a missed/unmatched cancel/revoke event (e.g. a row whose
 * `polar_subscription_id` was never stored) can leave the tier stuck on a paid plan
 * after the subscription has actually ended. This module re-derives the correct tier
 * from Polar's live customer state and corrects the DB when it has drifted.
 */
import { Polar } from '@polar-sh/sdk';
import { db, organizations, member } from '@repo/db';
import { eq } from 'drizzle-orm';
import { env } from './env';
import { log, serializeError } from './logger';
import { TIER_ORDER, type PlanTier } from './plans-config';

const polarClient = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: env.POLAR_SERVER_MODE,
});

/** Map a Polar product ID to its plan tier, or null if it isn't a known product. */
export function productIdToTier(productId: string): Exclude<PlanTier, 'free'> | null {
  switch (productId) {
    case env.POLAR_STARTER_PRODUCT_ID:
      return 'starter';
    case env.POLAR_PRODUCT_ID:
      return 'pro';
    case env.POLAR_BUSINESS_PRODUCT_ID:
      return 'business';
    default:
      return null;
  }
}

/** Pick the higher of two tiers by TIER_ORDER. */
function higherTier(a: PlanTier, b: PlanTier): PlanTier {
  return TIER_ORDER.indexOf(a) >= TIER_ORDER.indexOf(b) ? a : b;
}

interface PolarTruth {
  tier: PlanTier;
  subscriptionId: string | null;
}

/**
 * Queries Polar for the live subscription state of every org member, and returns the
 * highest active tier plus its subscription id. Polar customers are linked to better-auth
 * users via Polar's `external_id` (set to `user.id` by the @polar-sh/better-auth plugin),
 * so we look them up by external id rather than via the account table.
 * Returns `free`/`null` when no active subscription is found, or `null` if no member has a
 * reachable Polar customer (so callers leave the DB untouched rather than wrongly downgrading).
 */
async function getPolarTruthForOrg(orgId: string): Promise<PolarTruth | null> {
  const members = await db
    .select({ userId: member.userId })
    .from(member)
    .where(eq(member.organizationId, orgId));

  const userIds = [...new Set(members.map((m) => m.userId))];
  if (userIds.length === 0) return null;

  let tier: PlanTier = 'free';
  let subscriptionId: string | null = null;
  let foundCustomer = false;

  for (const userId of userIds) {
    let state;
    try {
      state = await polarClient.customers.getStateExternal({ externalId: userId });
    } catch {
      // No Polar customer for this user (404) — they never went through checkout. Skip.
      continue;
    }
    foundCustomer = true;
    for (const sub of state.activeSubscriptions ?? []) {
      if (sub.status !== 'active') continue;
      const subTier = productIdToTier(sub.productId);
      if (!subTier) continue;
      const next = higherTier(tier, subTier);
      if (next !== tier) {
        tier = next;
        subscriptionId = sub.id;
      }
    }
  }

  if (!foundCustomer) return null; // No reachable Polar customer — nothing to reconcile against.
  return { tier, subscriptionId };
}

/**
 * Reconciles an organization's stored plan tier against Polar's live state.
 * Best-effort: never throws — logs and returns on failure so callers (page loads,
 * webhooks) are not broken by a Polar outage. Skips orgs on an active trial so the
 * trial's pro-equivalent access is preserved.
 */
export async function reconcileOrgPlanWithPolar(orgId: string): Promise<void> {
  try {
    const [org] = await db
      .select({
        planTier: organizations.planTier,
        trialEndsAt: organizations.trialEndsAt,
        polarSubscriptionId: organizations.polarSubscriptionId,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org) return;

    // Don't disturb an active free trial.
    const isTrialing =
      org.planTier === 'free' && !!org.trialEndsAt && org.trialEndsAt > new Date();
    if (isTrialing) return;

    const truth = await getPolarTruthForOrg(orgId);
    if (!truth) return; // No linked Polar customer — nothing to reconcile against.

    const tierMatches = org.planTier === truth.tier;
    const subMatches = org.polarSubscriptionId === truth.subscriptionId;
    if (tierMatches && subMatches) return; // Already in sync.

    await db
      .update(organizations)
      .set({
        planTier: truth.tier,
        polarSubscriptionId: truth.subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));

    log.info('Reconciled org plan with Polar', {
      orgId,
      from: org.planTier,
      to: truth.tier,
    });
  } catch (error) {
    log.error('Failed to reconcile org plan with Polar', {
      orgId,
      error: serializeError(error),
    });
  }
}
