CREATE TABLE IF NOT EXISTS "meal_option_library" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "organization_id" uuid REFERENCES "organizations"("id") ON DELETE cascade,
  "is_global" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "meal_option_library_org_name_unique"
  ON "meal_option_library" ("organization_id", "name");

ALTER TABLE "proposal_meals"
  ADD COLUMN IF NOT EXISTS "options" text[] DEFAULT ARRAY[]::text[] NOT NULL;
