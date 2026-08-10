-- Global (cross-organization) catalog of inclusion/exclusion phrases used on
-- the pricing page. Applied directly (additive) against the shared Supabase
-- DB, not via drizzle-kit push.

DO $$ BEGIN
  CREATE TYPE "public"."inclusion_exclusion_kind" AS ENUM ('inclusion', 'exclusion');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "inclusion_exclusion_library" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kind" "inclusion_exclusion_kind" NOT NULL,
  "text" text NOT NULL,
  "usage_count" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "inclusion_exclusion_library_kind_text_unique"
  ON "inclusion_exclusion_library" ("kind", "text");
