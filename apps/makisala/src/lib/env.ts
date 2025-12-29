import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
    server: {
        DATABASE_URL: z.string().url(),
        CLOUDINARY_CLOUD_NAME: z.string(),
        CLOUDINARY_API_KEY: z.string(),
        CLOUDINARY_API_SECRET: z.string(),
    },

    client: {
        NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
        NEXT_PUBLIC_POSTHOG_HOST: z.string().min(1),
        NEXT_PUBLIC_DUFFEL_KEY: z.string().min(1),
        NEXT_PUBLIC_BETTER_AUTH_URL: z.string(),
    },

    runtimeEnv: {
        DATABASE_URL: process.env.DATABASE_URL,
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
        NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
        NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        NEXT_PUBLIC_DUFFEL_KEY: process.env.NEXT_PUBLIC_DUFFEL_KEY,
    },

    /**
     * By default, this library will feed the environment variables directly to
     * the Zod validator.
     *
     * This means that if you have an empty string for a value that is supposed
     * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
     * it as a type mismatch violation. Additionally, if you have an empty string
     * for a value that is supposed to be a string with a default value (e.g.
     * `DOMAIN=` in an ".env" file), the default value will never be applied.
     *
     * In order to solve these issues, we recommend that all new projects
     * explicitly specify this option as true.
     */
    emptyStringAsUndefined: true,
})
