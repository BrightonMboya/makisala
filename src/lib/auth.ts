import { betterAuth } from 'better-auth'
import { db } from '@/db'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { createAuthClient } from 'better-auth/react'
import { env } from '@/lib/env'

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
    }),
    emailAndPassword: {
        enabled: true,
    },
})

export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: env.BETTER_AUTH_URL,
})

export const { signIn, signUp, useSession } = createAuthClient()
