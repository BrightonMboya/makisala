-- Invoice payment tracking + tax identity. Additive only.
-- Applied directly (not via drizzle push) per shared-DB policy.

-- Invoice lifecycle status (draft -> sent -> paid, plus void).
DO $$ BEGIN
  CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'void');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Org business identity for the invoice "From" block.
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "address" text;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "tax_id" text;

-- Invoice payment tracking + frozen payout-method snapshot.
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "payment_methods" json DEFAULT '[]'::json NOT NULL;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "status" "invoice_status" DEFAULT 'draft' NOT NULL;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "amount_paid_cents" integer DEFAULT 0 NOT NULL;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paid_at" timestamp (3);

-- Backfill status for rows created before this column existed.
UPDATE "invoices" SET "status" = 'sent' WHERE "sent_at" IS NOT NULL AND "status" = 'draft';
