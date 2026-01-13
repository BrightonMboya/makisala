import { betterAuth } from 'better-auth'
import { db } from '@repo/db'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organizations, user as userTable, teamInvitations } from '@repo/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomBytes } from 'crypto'

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            organizationId: {
                type: 'string',
                required: false,
            },
        },
    },
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    // Check if there's a pending invitation for this email
                    const [invitation] = await db
                        .select()
                        .from(teamInvitations)
                        .where(
                            and(
                                eq(teamInvitations.email, user.email),
                                eq(teamInvitations.status, 'pending')
                            )
                        )
                        .limit(1)

                    if (invitation && new Date(invitation.expiresAt) > new Date()) {
                        // Accept the invitation automatically
                        await db
                            .update(userTable)
                            .set({
                                organizationId: invitation.organizationId,
                                role: invitation.role,
                            })
                            .where(eq(userTable.id, user.id))

                        await db
                            .update(teamInvitations)
                            .set({ status: 'accepted', acceptedAt: new Date() })
                            .where(eq(teamInvitations.id, invitation.id))
                    } else if (!user.organizationId) {
                        // Create new organization for user (existing logic)
                        const userName = user.name || 'User'
                        const orgName = `${userName}'s Agency`
                        const slug = `${userName.toLowerCase().replace(/\s+/g, '-')}-${randomBytes(8).toString('hex')}`
                        const [org] = await db
                            .insert(organizations)
                            .values({
                                name: orgName,
                                slug: slug,
                            })
                            .returning()

                        if (org) {
                            await db
                                .update(userTable)
                                .set({
                                    organizationId: org.id,
                                    role: 'admin',
                                })
                                .where(eq(userTable.id, user.id))
                        }
                    }
                },
            },
        },
    },
})
