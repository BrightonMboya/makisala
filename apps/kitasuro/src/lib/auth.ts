import { betterAuth } from 'better-auth';
import { db, invitation, member, organizations } from '@repo/db';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';
import { passkey } from '@better-auth/passkey';
import { polar, checkout, portal, webhooks } from '@polar-sh/better-auth';
import { Polar } from '@polar-sh/sdk';
import { sendEmailVerificationEmail, sendTeamInvitationEmail } from '@repo/resend';
import { and, eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { env } from './env';
import { log, serializeError } from './logger';
import type { PlanTier } from './plans-config';

// Initialize Polar client
const polarClient = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: env.POLAR_SERVER_MODE,
});

// Constants
const SLUG_RANDOM_BYTES = 8;
const MEMBER_ID_BYTES = 16;
const INVITATION_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days
const INVITATION_EXPIRY_MS = INVITATION_EXPIRY_SECONDS * 1000;
const TRIAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

/**
 * Sanitizes a string for use in URL slugs.
 * Removes special characters, normalizes unicode, and converts to lowercase.
 */
function sanitizeSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

export const auth = betterAuth({
  baseURL: env.NEXT_PUBLIC_APP_URL,
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      const verificationUrl = new URL(url);
      verificationUrl.searchParams.set('callbackURL', '/dashboard?verified=true');

      // Use setImmediate to fully decouple email sending from request timing
      // This prevents timing attacks by ensuring consistent response times
      setImmediate(() => {
        sendEmailVerificationEmail({
          recipientEmail: user.email,
          userName: user.name,
          verificationUrl: verificationUrl.toString(),
        }).catch((error) => {
          log.warn('Failed to send verification email', { error: serializeError(error) });
        });
      });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      // Force account selection on each sign-in for better UX
      prompt: 'select_account',
    },
  },
  // Enable automatic account linking for users with the same email
  // Google always verifies emails, so accounts will link automatically
  accountLinking: {
    enabled: true,
    trustedProviders: ['google'],
  },
  // Database hooks for user and session management
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          // Set initial active organization when session is created
          const [membership] = await db
            .select({ organizationId: member.organizationId })
            .from(member)
            .where(eq(member.userId, session.userId))
            .limit(1);

          return {
            data: {
              ...session,
              activeOrganizationId: membership?.organizationId || null,
            },
          };
        },
      },
    },
    user: {
      create: {
        after: async (user) => {
          // Check if there's a pending invitation for this email
          const [pendingInvitation] = await db
            .select()
            .from(invitation)
            .where(and(eq(invitation.email, user.email), eq(invitation.status, 'pending')))
            .limit(1);

          // If there's a pending invitation, don't create a new org
          // The user will accept the invitation separately
          if (pendingInvitation) {
            return;
          }

          // No invitation - create new organization for the user
          const userName = user.name || 'User';
          const orgName = `${userName}'s Agency`;
          const sanitizedName = sanitizeSlug(userName) || 'user';
          const slug = `${sanitizedName}-${randomBytes(SLUG_RANDOM_BYTES).toString('hex')}`;

          // Create the organization with 14-day trial
          const [org] = await db
            .insert(organizations)
            .values({
              name: orgName,
              slug: slug,
              trialEndsAt: new Date(Date.now() + TRIAL_DURATION_MS),
            })
            .returning();

          if (org) {
            // Add user as admin member of the organization
            await db.insert(member).values({
              id: randomBytes(MEMBER_ID_BYTES).toString('hex'),
              userId: user.id,
              organizationId: org.id,
              role: 'admin',
            });
          }
        },
      },
    },
  },
  plugins: [
    passkey({
      rpID: new URL(env.NEXT_PUBLIC_APP_URL).hostname,
      rpName: 'Kitasuro',
      origin: env.NEXT_PUBLIC_APP_URL,
    }),
    organization({
      // Send invitation email when a member is invited
      async sendInvitationEmail(data) {
        const inviteUrl = `${env.NEXT_PUBLIC_APP_URL}/invite/${data.id}`;
        const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_MS);
        await sendTeamInvitationEmail({
          recipientEmail: data.email,
          inviterName: data.inviter.user.name,
          organizationName: data.organization.name,
          role: data.role as 'admin' | 'member',
          inviteUrl,
          expiresAt: expiresAt.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        });
      },
      // Allow users to create organizations
      allowUserToCreateOrganization: true,
      // Creator becomes admin
      creatorRole: 'admin',
      // 7 days invitation expiry
      invitationExpiresIn: INVITATION_EXPIRY_SECONDS,
      // Map to existing organizations table with custom fields
      schema: {
        organization: {
          modelName: 'organizations',
          fields: {
            id: 'id',
            name: 'name',
            slug: 'slug',
            logo: 'logo_url',
            createdAt: 'created_at',
          },
          additionalFields: {
            notificationEmail: {
              type: 'string',
              input: true,
            },
          },
        },
      },
    }),
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: env.POLAR_STARTER_PRODUCT_ID,
              slug: 'starter',
            },
            {
              productId: env.POLAR_PRODUCT_ID,
              slug: 'pro',
            },
            {
              productId: env.POLAR_BUSINESS_PRODUCT_ID,
              slug: 'business',
            },
          ],
          successUrl: `${env.NEXT_PUBLIC_APP_URL}/settings?tab=billing&checkout=success`,
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          secret: env.POLAR_WEBHOOK_SECRET,
          onPayload: async (payload) => {
            // Map Polar product IDs to plan tiers
            const productToTier: Record<string, Exclude<PlanTier, 'free'>> = {
              [env.POLAR_STARTER_PRODUCT_ID]: 'starter',
              [env.POLAR_PRODUCT_ID]: 'pro',
              [env.POLAR_BUSINESS_PRODUCT_ID]: 'business',
            };

            if (
              payload.type === 'subscription.created' ||
              payload.type === 'subscription.updated'
            ) {
              const sub = payload.data;
              const customerId = sub.customerId;
              const productId = sub.productId;
              const tier = productToTier[productId];

              if (!tier || !customerId) return;

              // Determine if this is an active subscription
              const isActive = sub.status === 'active';

              const { account: accountTable } = await import('@repo/db/schema');

              // Use transaction to prevent race conditions between concurrent webhooks
              await db.transaction(async (tx) => {
                // Find user by Polar customer ID (stored in account table by polar plugin)
                const [acct] = await tx
                  .select({ userId: accountTable.userId })
                  .from(accountTable)
                  .where(
                    and(
                      eq(accountTable.providerId, 'polar'),
                      eq(accountTable.accountId, customerId),
                    ),
                  )
                  .limit(1);

                if (!acct) return;

                // Find user's organization via member table
                const [membership] = await tx
                  .select({ organizationId: member.organizationId })
                  .from(member)
                  .where(eq(member.userId, acct.userId))
                  .limit(1);

                if (!membership) return;

                // Update organization plan
                await tx
                  .update(organizations)
                  .set({
                    planTier: isActive ? tier : 'free',
                    polarSubscriptionId: sub.id,
                    updatedAt: new Date(),
                  })
                  .where(eq(organizations.id, membership.organizationId));
              });
            }

            if (payload.type === 'subscription.canceled') {
              const sub = payload.data;
              if (sub.id) {
                // If the subscription has a period end date, the user retains access
                // until then. Polar will send subscription.revoked when access should end.
                // Only downgrade immediately if there's no period end (e.g. immediate cancel).
                const periodEnd = sub.currentPeriodEnd
                  ? new Date(sub.currentPeriodEnd)
                  : null;
                const shouldDowngradeNow = !periodEnd || periodEnd <= new Date();

                if (shouldDowngradeNow) {
                  await db
                    .update(organizations)
                    .set({
                      planTier: 'free',
                      updatedAt: new Date(),
                    })
                    .where(eq(organizations.polarSubscriptionId, sub.id));
                }
                // If periodEnd is in the future, user keeps access until then.
                // The subscription.revoked webhook will handle the final downgrade.
              }
            }

            if (payload.type === 'subscription.revoked') {
              const sub = payload.data;
              // Access has been fully revoked — downgrade to free
              if (sub.id) {
                await db
                  .update(organizations)
                  .set({
                    planTier: 'free',
                    updatedAt: new Date(),
                  })
                  .where(eq(organizations.polarSubscriptionId, sub.id));
              }
            }
          },
        }),
      ],
    }),
  ],
});
