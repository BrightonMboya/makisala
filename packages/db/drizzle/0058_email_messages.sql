-- Email delivery analytics. Additive only (new table + indexes).
CREATE TABLE IF NOT EXISTS "email_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resend_id" text NOT NULL,
	"type" text NOT NULL,
	"organization_id" uuid,
	"proposal_id" text,
	"invoice_id" text,
	"to_email" text NOT NULL,
	"subject" text,
	"status" text DEFAULT 'sent' NOT NULL,
	"sent_at" timestamp(3),
	"delivered_at" timestamp(3),
	"delivery_delayed_at" timestamp(3),
	"opened_at" timestamp(3),
	"clicked_at" timestamp(3),
	"bounced_at" timestamp(3),
	"complained_at" timestamp(3),
	"failed_at" timestamp(3),
	"last_event_at" timestamp(3),
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "email_messages_resend_id_unique" UNIQUE("resend_id")
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_messages_proposal_idx" ON "email_messages" USING btree ("proposal_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_messages_invoice_idx" ON "email_messages" USING btree ("invoice_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_messages_org_idx" ON "email_messages" USING btree ("organization_id");
