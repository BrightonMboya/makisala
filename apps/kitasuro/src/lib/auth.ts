import { betterAuth } from 'better-auth'
import { db, organizations, member, invitation } from '@repo/db'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization } from 'better-auth/plugins'
import { sendTeamInvitationEmail } from '@repo/resend'
import { eq, and } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { env } from './env'

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
    }),
    emailAndPassword: {
        enabled: true,
    },
    // Auto-create organization when user signs up
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    // Check if there's a pending invitation for this email
                    const [pendingInvitation] = await db
                        .select()
                        .from(invitation)
                        .where(
                            and(
                                eq(invitation.email, user.email),
                                eq(invitation.status, 'pending')
                            )
                        )
                        .limit(1)

                    // If there's a pending invitation, don't create a new org
                    // The user will accept the invitation separately
                    if (pendingInvitation) {
                        return
                    }

                    // No invitation - create new organization for the user
                    const userName = user.name || 'User'
                    const orgName = `${userName}'s Agency`
                    const slug = `${userName.toLowerCase().replace(/\s+/g, '-')}-${randomBytes(8).toString('hex')}`

                    // Create the organization
                    const [org] = await db
                        .insert(organizations)
                        .values({
                            name: orgName,
                            slug: slug,
                        })
                        .returning()

                    if (org) {
                        // Add user as admin member of the organization
                        await db.insert(member).values({
                            id: randomBytes(16).toString('hex'),
                            userId: user.id,
                            organizationId: org.id,
                            role: 'admin',
                        })
                    }
                },
            },
        },
    },
    plugins: [
        organization({
            // Send invitation email when a member is invited
            async sendInvitationEmail(data) {
                const inviteUrl = `${env.NEXT_PUBLIC_APP_URL}/invite/${data.id}`
                // Calculate expiration date (7 days from now based on invitationExpiresIn)
                const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
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
                })
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
})
