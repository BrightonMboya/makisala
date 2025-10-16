// this is a special nextjs file for monitoring and observability

import posthog from 'posthog-js'
import {env} from "@/lib/env"

posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: '2025-05-24'
});