// this is a special nextjs file for monitoring and observability

import posthog from 'posthog-js'
import { env } from './lib/env'

posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: 'https://v.makisala.com',
    defaults: '2026-01-30',
})
