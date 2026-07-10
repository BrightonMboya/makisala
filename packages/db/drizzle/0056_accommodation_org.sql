-- Org-private lodges.
-- NULL organization_id = curated/global lodge (shared catalog, current behavior).
-- Non-null = a lodge one org added privately: only that org sees it in search/builder.
ALTER TABLE "accommodations"
  ADD COLUMN IF NOT EXISTS "organization_id" uuid REFERENCES "organizations"("id") ON DELETE cascade;

CREATE INDEX IF NOT EXISTS "idx_accommodations_org"
  ON "accommodations" ("organization_id");
