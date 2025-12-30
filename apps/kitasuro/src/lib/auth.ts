import { betterAuth } from 'better-auth'
import { db } from '@repo/db'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organizations, user as userTable } from '@repo/db/schema'
import { eq } from 'drizzle-orm'

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
                    if (!user.organizationId) {
                        const orgName = `${user.name}'s Agency`
                        const slug = `${user.name.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substring(7)}`
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
                                })
                                .where(eq(userTable.id, user.id))
                        }
                    }
                },
            },
        },
    },
})
