-- Per-organization catalog of custom traveler categories (e.g. "Infant",
-- "Guide") typed on the fly in the traveler group editors, mirroring
-- moment_library / extra_unit_library. Applied directly (additive) against
-- the shared Supabase DB, not via drizzle-kit push.

CREATE TABLE IF NOT EXISTS "traveler_category_library" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "organization_id" uuid REFERENCES "organizations"("id") ON DELETE CASCADE,
  "is_global" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "traveler_category_library_org_name_unique"
  ON "traveler_category_library" ("organization_id", "name");
