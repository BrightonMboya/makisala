-- Pricing engine v2: guide fee, per-person park ancillary fees, transit fees,
-- meal costs, flight rates, tiered markup, and the day-kind/is-transit flags
-- that drive them. All additive — no drops, no renames. Applied directly
-- against the shared dev DB (this repo's drizzle migration journal is out of
-- sync with the applied .sql files above 0043, so this is hand-run rather
-- than through `drizzle-kit migrate`, matching existing practice here).

ALTER TYPE "park_ancillary_charge_basis" ADD VALUE IF NOT EXISTS 'per_person_per_day';

DO $$ BEGIN
  CREATE TYPE "park_fee_type" AS ENUM ('entrance', 'transit');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "day_kind" AS ENUM ('touring', 'airport_transfer', 'none');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "park_fee_rates" ADD COLUMN IF NOT EXISTS "fee_type" "park_fee_type" NOT NULL DEFAULT 'entrance';

ALTER TABLE "park_ancillary_fees" ADD COLUMN IF NOT EXISTS "category" "park_fee_category";

CREATE TABLE IF NOT EXISTS "guides" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "touring_rate" numeric(12,2) NOT NULL,
  "airport_transfer_rate" numeric(12,2) NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_guides_org" ON "guides" ("organization_id");

CREATE TABLE IF NOT EXISTS "meal_cost_rates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "per_person_rate" numeric(12,2) NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_meal_cost_rates_org" ON "meal_cost_rates" ("organization_id");

CREATE TABLE IF NOT EXISTS "flight_rates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "season_id" uuid REFERENCES "seasons"("id") ON DELETE CASCADE,
  "per_person_rate" numeric(12,2) NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_flight_rates_org" ON "flight_rates" ("organization_id");

ALTER TABLE "pricing_settings" ADD COLUMN IF NOT EXISTS "markup_tiers" jsonb;

ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "guide_id" uuid REFERENCES "guides"("id") ON DELETE SET NULL;

ALTER TABLE "proposal_days" ADD COLUMN IF NOT EXISTS "day_kind" "day_kind" NOT NULL DEFAULT 'touring';
ALTER TABLE "proposal_days" ADD COLUMN IF NOT EXISTS "is_transit" boolean NOT NULL DEFAULT false;
ALTER TABLE "proposal_days" ADD COLUMN IF NOT EXISTS "meal_cost_id" uuid REFERENCES "meal_cost_rates"("id") ON DELETE SET NULL;

ALTER TABLE "proposal_transportation" ADD COLUMN IF NOT EXISTS "flight_rate_id" uuid REFERENCES "flight_rates"("id") ON DELETE SET NULL;
