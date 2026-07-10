-- Per-org hide for curated/global accommodation images.
-- A row here means: this org has hidden this (shared) image from its own
-- gallery and proposals. The underlying image record is untouched, so every
-- other org still sees it. Reversible by deleting the row (unhide).
CREATE TABLE IF NOT EXISTS "hidden_accommodation_images" (
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
  "image_id" uuid NOT NULL REFERENCES "accommodation_images"("id") ON DELETE cascade,
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "hidden_accommodation_images_pkey" PRIMARY KEY ("organization_id", "image_id")
);

CREATE INDEX IF NOT EXISTS "idx_hidden_acc_images_org"
  ON "hidden_accommodation_images" ("organization_id");
