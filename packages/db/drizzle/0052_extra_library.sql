-- Optional-extras catalog, per organization (with shared global defaults).
-- Applied directly (additive) against the shared Supabase DB, not via drizzle-kit push.

CREATE TABLE IF NOT EXISTS "extra_library" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "organization_id" uuid,
  "is_global" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "extra_library"
    ADD CONSTRAINT "extra_library_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "extra_library_organization_id_idx"
  ON "extra_library" ("organization_id");

-- Seed the former hard-coded defaults as global rows so every org still sees them.
INSERT INTO "extra_library" ("name", "is_global")
SELECT v.name, true
FROM (VALUES
  ('Airport Transfer'),
  ('Pre-tour Accommodation'),
  ('Post-tour Accommodation'),
  ('Visa Fee'),
  ('Travel Insurance'),
  ('Gorilla Permit')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM "extra_library" e
  WHERE e."is_global" = true AND e."name" = v.name
);
