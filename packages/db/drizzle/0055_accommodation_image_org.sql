-- Org-scoped accommodation images.
-- NULL organization_id = curated/global image (shared with every org, current behavior).
-- Non-null = private to that org: visible only to that org and deletable only by it.
ALTER TABLE "accommodation_images"
  ADD COLUMN IF NOT EXISTS "organization_id" uuid REFERENCES "organizations"("id") ON DELETE cascade,
  ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now();

CREATE INDEX IF NOT EXISTS "idx_accommodation_images_org"
  ON "accommodation_images" ("organization_id");
