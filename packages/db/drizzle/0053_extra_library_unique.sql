-- Unique (organization_id, name) for extra_library so create-on-the-fly can
-- upsert in one round trip. Applied directly (additive) against the shared Supabase DB.
CREATE UNIQUE INDEX IF NOT EXISTS "extra_library_org_name_unique"
  ON "extra_library" ("organization_id", "name");
