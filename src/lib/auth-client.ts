import { createAuthClient } from 'better-auth/client'
import { env } from '@/lib/env'

export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL,
})

export const { signIn, signUp, useSession } = createAuthClient()
