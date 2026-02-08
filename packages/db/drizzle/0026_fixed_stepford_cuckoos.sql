CREATE TABLE "organization_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proposal_transportation" DROP CONSTRAINT "proposal_transportation_proposal_id_proposals_id_fk";
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "about_description" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "payment_terms" text;--> statement-breakpoint
ALTER TABLE "proposal_activities" ADD COLUMN "time" text;--> statement-breakpoint
ALTER TABLE "proposal_transportation" ADD COLUMN "proposal_day_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_images" ADD CONSTRAINT "organization_images_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_transportation" ADD CONSTRAINT "proposal_transportation_proposal_day_id_proposal_days_id_fk" FOREIGN KEY ("proposal_day_id") REFERENCES "public"."proposal_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_transportation" DROP COLUMN "proposal_id";--> statement-breakpoint
ALTER TABLE "proposal_transportation" DROP COLUMN "sort_order";