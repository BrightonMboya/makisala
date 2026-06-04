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
import { reconcileOrgPlanWithPolar, productIdToTier } from './billing-reconcile';

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
      verificationUrl.searchParams.set('callbackURL', '/onboarding?verified=true');

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
      rpName: 'Ratiba',
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
            // Resolve the org for a subscription event via the customer's external id.
            // The @polar-sh/better-auth plugin links each Polar customer to a better-auth
            // user through Polar's external_id field (set to user.id), so the webhook's
            // customer.externalId is that user id. We map user -> member -> org.
            // (There is no 'polar' row in the account table to look up by customer id.)
            const resolveOrgId = async (
              externalId: string | null | undefined,
            ): Promise<string | null> => {
              if (!externalId) return null;
              const [membership] = await db
                .select({ organizationId: member.organizationId })
                .from(member)
                .where(eq(member.userId, externalId))
                .limit(1);
              return membership?.organizationId ?? null;
            };

            if (
              payload.type === 'subscription.created' ||
              payload.type === 'subscription.updated'
            ) {
              const sub = payload.data;
              const tier = productIdToTier(sub.productId);
              if (!tier) return;

              const orgId = await resolveOrgId(sub.customer?.externalId);
              if (!orgId) return;

              const isActive = sub.status === 'active';

              await db
                .update(organizations)
                .set({
                  planTier: isActive ? tier : 'free',
                  polarSubscriptionId: sub.id,
                  updatedAt: new Date(),
                })
                .where(eq(organizations.id, orgId));
            }

            // For cancellation and revocation, re-derive the tier from Polar's live state
            // instead of matching on the stored subscription id. This self-heals orgs whose
            // polar_subscription_id was never recorded, and correctly preserves access when
            // a scheduled cancel still has an active period or another active subscription
            // exists. Polar still reports a cancel-at-period-end subscription as active until
            // it actually ends, so reconcile keeps the plan until the final lapse.
            if (
              payload.type === 'subscription.canceled' ||
              payload.type === 'subscription.revoked'
            ) {
              const orgId = await resolveOrgId(payload.data.customer?.externalId);
              if (orgId) await reconcileOrgPlanWithPolar(orgId);
            }
          },
        }),
      ],
    }),
  ],
});
