-- Client / Trip Portals: post-booking traveler intake.
-- Applied directly (additive) against the shared Supabase DB, not via drizzle-kit push.

DO $$ BEGIN
  CREATE TYPE "public"."client_portal_status" AS ENUM('pending', 'in_progress', 'submitted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "client_portals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "proposal_id" text,
  "client_id" uuid,
  "trip_name" text NOT NULL,
  "welcome_message" text,
  "share_token" text NOT NULL,
  "status" "client_portal_status" DEFAULT 'pending' NOT NULL,
  "due_date" timestamp(3),
  "submitted_at" timestamp(3),
  "created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "client_portals_share_token_unique" UNIQUE("share_token")
);

CREATE TABLE IF NOT EXISTS "portal_travelers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "portal_id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "is_lead" boolean DEFAULT false NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "full_name" text NOT NULL,
  "nationality" text,
  "date_of_birth" text,
  "gender" text,
  "passport_number" text,
  "passport_issuing_country" text,
  "passport_expiry" text,
  "dietary_preferences" text,
  "allergies" text,
  "medical_notes" text,
  "emergency_contact_name" text,
  "emergency_contact_phone" text,
  "arrival_details" text,
  "special_requests" text,
  "created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "client_portals" ADD CONSTRAINT "client_portals_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "client_portals" ADD CONSTRAINT "client_portals_proposal_id_proposals_id_fk"
    FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "client_portals" ADD CONSTRAINT "client_portals_client_id_clients_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "portal_travelers" ADD CONSTRAINT "portal_travelers_portal_id_client_portals_id_fk"
    FOREIGN KEY ("portal_id") REFERENCES "public"."client_portals"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "portal_travelers" ADD CONSTRAINT "portal_travelers_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS "client_portals_org_idx" ON "client_portals" ("organization_id");
CREATE INDEX IF NOT EXISTS "client_portals_proposal_idx" ON "client_portals" ("proposal_id");
CREATE INDEX IF NOT EXISTS "portal_travelers_portal_idx" ON "portal_travelers" ("portal_id");
