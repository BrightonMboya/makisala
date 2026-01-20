import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    // Supabase
    SUPABASE_URL: z.url(),
    SUPABASE_SERVICE_KEY: z.string().min(1),
    SUPABASE_PUBLIC_BUCKET: z.string().default('public-assets'),
    SUPABASE_PRIVATE_BUCKET: z.string().default('private-assets'),

    // Cloudinary (legacy - may be removed)
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),

    // Email (must be configured per deployment)
    RESEND_FROM_EMAIL: z.email(),
  },

  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
  },

  runtimeEnv: {
    // Server
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    SUPABASE_PUBLIC_BUCKET: process.env.SUPABASE_PUBLIC_BUCKET,
    SUPABASE_PRIVATE_BUCKET: process.env.SUPABASE_PRIVATE_BUCKET,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,

    // Client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  emptyStringAsUndefined: true,
});
