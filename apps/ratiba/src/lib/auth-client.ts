import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'
import { passkeyClient } from '@better-auth/passkey/client'
import { polarClient } from '@polar-sh/better-auth/client'
import { env } from './env'

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_URL,
  plugins: [organizationClient(), passkeyClient(), polarClient()],
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
  // Polar billing methods
  checkout,
  customer,
} = authClient
