import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'
import { passkeyClient } from '@better-auth/passkey/client'
import { env } from './env'

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_URL,
  plugins: [organizationClient(), passkeyClient()],
})

export const {
  signIn,
  signUp,
  useSession,
  signOut,
  // Organization methods
  organization,
  useActiveOrganization,
  useListOrganizations,
} = authClient
