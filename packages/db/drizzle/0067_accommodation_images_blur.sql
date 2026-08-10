-- Precomputed blur-up placeholder for accommodation photos, generated once at
-- upload time instead of a live Cloudflare Image Resizing request on every
-- gallery load. Applied directly (additive) against the shared Supabase DB,
-- not via drizzle-kit push.

ALTER TABLE "accommodation_images" ADD COLUMN IF NOT EXISTS "blur_data_url" text;
