import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    // Supabase (database only now - storage moved to R2)
    SUPABASE_URL: z.url(),
    SUPABASE_SERVICE_KEY: z.string().min(1),

    // Cloudflare R2 Storage
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_ACCOUNT_ID: z.string().min(1),
    R2_BUCKET_NAME: z.string().min(1),
    R2_PUBLIC_URL: z.url(), // Your R2 public URL (r2.dev or custom domain)

    // Cloudinary (legacy - may be removed)
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),

    // Email (must be configured per deployment)
    RESEND_FROM_EMAIL: z.email(),

    // Google OAuth
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),

    // Groq (translation)
    GROQ_API_KEY: z.string().min(1),

    // Polar billing
    POLAR_ACCESS_TOKEN: z.string().min(1),
    POLAR_PRODUCT_ID: z.string().min(1), // Pro tier
    POLAR_STARTER_PRODUCT_ID: z.string().min(1),
    POLAR_BUSINESS_PRODUCT_ID: z.string().min(1),
    POLAR_WEBHOOK_SECRET: z.string().min(1),
    POLAR_SERVER_MODE: z.enum(['sandbox', 'production']).default('sandbox'),

    // Shared secret Vercel Cron sends as `Authorization: Bearer <CRON_SECRET>`.
    // Optional so local dev boots without it; the cron route rejects when unset.
    CRON_SECRET: z.string().min(1).optional(),

    // Cloudflare Browser Rendering (proposal-PDF render experiment). Runs on the
    // same Cloudflare account as R2, so it reuses R2_ACCOUNT_ID; only the token
    // (scoped to Browser Rendering) is new. Optional so the app boots without it;
    // the render/benchmark path errors when unset.
    CLOUDFLARE_BROWSER_RENDERING_TOKEN: z.string().min(1).optional(),
    // Guards the dev-only /api/dev/pdf-benchmark route in production. When unset,
    // the route is only reachable in non-production builds.
    PDF_BENCHMARK_KEY: z.string().min(1).optional(),
  },

  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
    NEXT_PUBLIC_AXIOM_DATASET: z.string().optional(),
    NEXT_PUBLIC_AXIOM_TOKEN: z.string().optional(),
    // Mapbox access token for the print-surface static route map. Public by design
    // (baked into the print page's <img> URL), so URL-restrict it to the app's
    // domain in the Mapbox dashboard. Optional so the app boots without it; the
    // static map falls back to a plain marker list when unset.
    NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1).optional(),
  },

  runtimeEnv: {
    // Server
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
    POLAR_PRODUCT_ID: process.env.POLAR_PRODUCT_ID,
    POLAR_STARTER_PRODUCT_ID: process.env.POLAR_STARTER_PRODUCT_ID,
    POLAR_BUSINESS_PRODUCT_ID: process.env.POLAR_BUSINESS_PRODUCT_ID,
    POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
    POLAR_SERVER_MODE: process.env.POLAR_SERVER_MODE,
    CRON_SECRET: process.env.CRON_SECRET,
    CLOUDFLARE_BROWSER_RENDERING_TOKEN: process.env.CLOUDFLARE_BROWSER_RENDERING_TOKEN,
    PDF_BENCHMARK_KEY: process.env.PDF_BENCHMARK_KEY,

    // Client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_AXIOM_DATASET: process.env.NEXT_PUBLIC_AXIOM_DATASET,
    NEXT_PUBLIC_AXIOM_TOKEN: process.env.NEXT_PUBLIC_AXIOM_TOKEN,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },

  emptyStringAsUndefined: true,
});
