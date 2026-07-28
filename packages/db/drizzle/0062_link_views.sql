-- Link view tracking (proposal/invoice page engagement). Additive only (new table + indexes).
CREATE TABLE IF NOT EXISTS "link_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"proposal_id" text,
	"invoice_id" text,
	"format" text DEFAULT 'html' NOT NULL,
	"session_id" text NOT NULL,
	"ip" text,
	"country" text,
	"region" text,
	"city" text,
	"device" text,
	"browser" text,
	"referrer" text,
	"duration_seconds" integer,
	"created_at" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "link_views" ADD CONSTRAINT "link_views_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "link_views" ADD CONSTRAINT "link_views_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "link_views" ADD CONSTRAINT "link_views_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "link_views_proposal_idx" ON "link_views" USING btree ("proposal_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "link_views_invoice_idx" ON "link_views" USING btree ("invoice_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "link_views_org_idx" ON "link_views" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "link_views_session_idx" ON "link_views" USING btree ("session_id");
