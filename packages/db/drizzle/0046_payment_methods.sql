-- Payment methods feature: store operator payout instructions (bank transfer
-- details, hosted payment links) and lock them once confirmed. Additive only.
-- Applied directly (not via drizzle push) per shared-DB policy.

DO $$ BEGIN
  CREATE TYPE "public"."payment_method_type" AS ENUM('bank_transfer', 'pesapal', 'stripe', 'paypal', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "payment_details_locked_at" timestamp;

CREATE TABLE IF NOT EXISTS "payment_methods" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "type" "payment_method_type" NOT NULL,
  "label" text NOT NULL,
  "instructions" text,
  "url" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "payment_methods"
    ADD CONSTRAINT "payment_methods_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "idx_payment_methods_organization_id" ON "payment_methods" ("organization_id");
