-- Client portal authentication + at-rest encryption support.
-- Additive, applied directly against the shared Supabase DB.

ALTER TABLE "client_portals" ADD COLUMN IF NOT EXISTS "lead_email" text;
ALTER TABLE "client_portals" ADD COLUMN IF NOT EXISTS "expires_at" timestamp(3);

ALTER TABLE "portal_travelers" ADD COLUMN IF NOT EXISTS "passport_scan_key" text;
ALTER TABLE "portal_travelers" ADD COLUMN IF NOT EXISTS "passport_scan_name" text;
ALTER TABLE "portal_travelers" ADD COLUMN IF NOT EXISTS "passport_scan_mime" text;

CREATE TABLE IF NOT EXISTS "portal_verifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "portal_id" uuid NOT NULL,
  "email" text NOT NULL,
  "code_hash" text NOT NULL,
  "link_token_hash" text NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "consumed_at" timestamp(3),
  "expires_at" timestamp(3) NOT NULL,
  "created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "portal_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "portal_id" uuid NOT NULL,
  "email" text NOT NULL,
  "token_hash" text NOT NULL,
  "ip" text,
  "user_agent" text,
  "last_seen_at" timestamp(3),
  "expires_at" timestamp(3) NOT NULL,
  "created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "portal_sessions_token_hash_unique" UNIQUE("token_hash")
);

CREATE TABLE IF NOT EXISTS "portal_access_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "portal_id" uuid NOT NULL,
  "email" text,
  "event" text NOT NULL,
  "ip" text,
  "user_agent" text,
  "created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "portal_verifications" ADD CONSTRAINT "portal_verifications_portal_id_client_portals_id_fk"
    FOREIGN KEY ("portal_id") REFERENCES "public"."client_portals"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "portal_sessions" ADD CONSTRAINT "portal_sessions_portal_id_client_portals_id_fk"
    FOREIGN KEY ("portal_id") REFERENCES "public"."client_portals"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "portal_access_events" ADD CONSTRAINT "portal_access_events_portal_id_client_portals_id_fk"
    FOREIGN KEY ("portal_id") REFERENCES "public"."client_portals"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS "portal_verifications_portal_idx" ON "portal_verifications" ("portal_id");
CREATE INDEX IF NOT EXISTS "portal_verifications_link_idx" ON "portal_verifications" ("link_token_hash");
CREATE INDEX IF NOT EXISTS "portal_sessions_portal_idx" ON "portal_sessions" ("portal_id");
CREATE INDEX IF NOT EXISTS "portal_sessions_token_idx" ON "portal_sessions" ("token_hash");
CREATE INDEX IF NOT EXISTS "portal_access_events_portal_idx" ON "portal_access_events" ("portal_id");
