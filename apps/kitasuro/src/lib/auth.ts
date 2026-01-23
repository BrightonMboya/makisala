import { betterAuth } from 'better-auth';
import { db, invitation, member, organizations } from '@repo/db';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';
import { passkey } from '@better-auth/passkey';
import { sendEmailVerificationEmail, sendTeamInvitationEmail } from '@repo/resend';
import { and, eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { env } from './env';

export const auth = betterAuth({
  baseURL: env.NEXT_PUBLIC_APP_URL,
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

      // Don't await to prevent timing attacks
      void sendEmailVerificationEmail({
        recipientEmail: user.email,
        userName: user.name,
        verificationUrl: verificationUrl.toString(),
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
          const slug = `${userName.toLowerCase().replace(/\s+/g, '-')}-${randomBytes(8).toString('hex')}`;

          // Create the organization
          const [org] = await db
            .insert(organizations)
            .values({
              name: orgName,
              slug: slug,
            })
            .returning();

          if (org) {
            // Add user as admin member of the organization
            await db.insert(member).values({
              id: randomBytes(16).toString('hex'),
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
        // Calculate expiration date (7 days from now based on invitationExpiresIn)
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
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
      // 7 days invitation expiry (same as previous implementation)
      invitationExpiresIn: 60 * 60 * 24 * 7,
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
            primaryColor: {
              type: 'string',
              defaultValue: '#15803d',
              input: true,
            },
            notificationEmail: {
              type: 'string',
              input: true,
            },
          },
        },
      },
    }),
  ],
});
