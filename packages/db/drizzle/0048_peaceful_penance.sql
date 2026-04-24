CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"proposal_id" text,
	"client_id" uuid,
	"number" text NOT NULL,
	"title" text,
	"currency" text DEFAULT 'USD' NOT NULL,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"tax_rate_pct" numeric(5, 2),
	"tax_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"line_items" json DEFAULT '[]'::json NOT NULL,
	"from_details" json,
	"to_details" json,
	"notes" text,
	"issue_date" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"due_date" timestamp(3),
	"sent_at" timestamp(3),
	"pdf_key" text,
	"share_token" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "invoices_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_org_number_idx" ON "invoices" USING btree ("organization_id","number");--> statement-breakpoint
CREATE INDEX "invoices_proposal_idx" ON "invoices" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "invoices_org_idx" ON "invoices" USING btree ("organization_id");