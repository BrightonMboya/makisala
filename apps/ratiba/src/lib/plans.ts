/**
 * Server-only plan utilities. Uses database queries.
 * For client-safe config/types, import from plans-config.ts.
 */
import { cache } from 'react';
import { db, organizations, member, invitation, proposals } from '@repo/db';
import { and, eq, sql } from 'drizzle-orm';
import { PLAN_CONFIG, TIER_ORDER, type PlanTier, type Feature } from './plans-config';

// Re-export config and types for convenience from server code
export { PLAN_CONFIG, ALLOWED_THEMES_BY_TIER, TIER_ORDER } from './plans-config';
export type { PlanTier, Feature, PlanLimits, PlanConfig } from './plans-config';

export interface OrgPlan {
  tier: PlanTier;
  effectiveTier: PlanTier; // May differ during trial (free + active trial = pro-equivalent)
  isTrialing: boolean;
  trialEndsAt: Date | null;
  trialDaysRemaining: number | null;
  limits: (typeof PLAN_CONFIG)[PlanTier]['limits'];
}

/**
 * Resolves the effective plan for an organization.
 * Handles trial logic: free tier with active trial gets pro-equivalent access.
 */
export const getOrgPlan = cache(async function getOrgPlan(orgId: string): Promise<OrgPlan | null> {
  const [org] = await db
    .select({
      planTier: organizations.planTier,
      trialEndsAt: organizations.trialEndsAt,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) return null;

  const tier = org.planTier as PlanTier;
  const now = new Date();
  const trialEndsAt = org.trialEndsAt;
  const isTrialing = tier === 'free' && !!trialEndsAt && trialEndsAt > now;

  let trialDaysRemaining: number | null = null;
  if (isTrialing && trialEndsAt) {
    trialDaysRemaining = Math.ceil(
      (trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  // During trial, free users get pro-level access
  const effectiveTier = isTrialing ? 'pro' : tier;

  return {
    tier,
    effectiveTier,
    isTrialing,
    trialEndsAt,
    trialDaysRemaining,
    limits: PLAN_CONFIG[effectiveTier].limits,
  };
});

export interface FeatureAccessResult {
  allowed: boolean;
  reason?: string;
  upgradeToTier?: PlanTier;
}

/**
 * Checks if an organization can access a specific feature.
 * For numeric limits (proposals, team members), pass the current count as context.
 */
export async function checkFeatureAccess(
  orgId: string,
  feature: Feature,
  context?: { currentCount?: number },
): Promise<FeatureAccessResult> {
  const plan = await getOrgPlan(orgId);
  if (!plan) return { allowed: false, reason: 'Organization not found' };

  const { limits } = plan;

  switch (feature) {
    case 'activeProposals': {
      if (limits.activeProposals === -1) return { allowed: true };
      const count =
        context?.currentCount ??
        (
          await db
            .select({ count: sql<number>`count(*)::int` })
            .from(proposals)
            .where(eq(proposals.organizationId, orgId))
        )[0]?.count ??
        0;
      if (count >= limits.activeProposals) {
        const nextTier = getUpgradeTier(plan.effectiveTier, feature);
        return {
          allowed: false,
          reason: `You've reached the limit of ${limits.activeProposals} proposals on the ${PLAN_CONFIG[plan.effectiveTier].name} plan`,
          upgradeToTier: nextTier,
        };
      }
      return { allowed: true };
    }

    case 'teamMembers': {
      if (limits.teamMembers === -1) return { allowed: true };
      // Count only non-admin members (admins/owners don't count toward the limit)
      const nonAdminCount =
        context?.currentCount ??
        (
          await db
            .select({ count: sql<number>`count(*)::int` })
            .from(member)
            .where(and(eq(member.organizationId, orgId), eq(member.role, 'member')))
        )[0]?.count ??
        0;
      // Also count pending invitations
      const pendingCount =
        (
          await db
            .select({ count: sql<number>`count(*)::int` })
            .from(invitation)
            .where(and(eq(invitation.organizationId, orgId), eq(invitation.status, 'pending')))
        )[0]?.count ?? 0;
      const total = nonAdminCount + pendingCount;
      if (total >= limits.teamMembers) {
        const nextTier = getUpgradeTier(plan.effectiveTier, feature);
        return {
          allowed: false,
          reason:
            limits.teamMembers === 0
              ? `Team members are not available on the ${PLAN_CONFIG[plan.effectiveTier].name} plan`
              : `You've reached the limit of ${limits.teamMembers} team members on the ${PLAN_CONFIG[plan.effectiveTier].name} plan`,
          upgradeToTier: nextTier,
        };
      }
      return { allowed: true };
    }

    case 'uploadImages':
    case 'allThemes':
    case 'noWatermark':
    case 'pdfExport':
    case 'comments':
    case 'customDomains': {
      if (limits[feature]) return { allowed: true };
      const nextTier = getUpgradeTier(plan.effectiveTier, feature);
      const featureNames: Record<string, string> = {
        uploadImages: 'Image uploads',
        allThemes: 'Premium themes',
        noWatermark: 'Watermark removal',
        pdfExport: 'PDF export',
        comments: 'Comments',
        customDomains: 'Custom domains',
      };
      return {
        allowed: false,
        reason: `${featureNames[feature]} ${feature === 'noWatermark' ? 'is' : 'are'} not available on the ${PLAN_CONFIG[plan.effectiveTier].name} plan`,
        upgradeToTier: nextTier,
      };
    }

    default:
      return { allowed: true };
  }
}

/**
 * Find the lowest tier that unlocks a given feature.
 */
function getUpgradeTier(currentTier: PlanTier, feature: Feature): PlanTier | undefined {
  const currentIdx = TIER_ORDER.indexOf(currentTier);
  for (let i = currentIdx + 1; i < TIER_ORDER.length; i++) {
    const tier = TIER_ORDER[i]!;
    const config = PLAN_CONFIG[tier];
    const val = config.limits[feature];
    // For numeric features, any higher limit counts
    if (typeof val === 'number') {
      const currentVal = PLAN_CONFIG[currentTier].limits[feature] as number;
      if (val === -1 || val > currentVal) return tier;
    }
    // For boolean features
    if (typeof val === 'boolean' && val) return tier;
  }
  return undefined;
}
