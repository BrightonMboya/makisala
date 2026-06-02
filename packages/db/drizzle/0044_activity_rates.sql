CREATE TYPE "public"."activity_charge_basis" AS ENUM('per_person', 'per_group');--> statement-breakpoint
ALTER TABLE "activity_library" ADD COLUMN "location_name" text;--> statement-breakpoint
ALTER TABLE "activity_library" ADD COLUMN "latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "activity_library" ADD COLUMN "longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "proposal_activities" ADD COLUMN "activity_library_id" uuid;--> statement-breakpoint
ALTER TABLE "proposal_activities" ADD CONSTRAINT "proposal_activities_activity_library_id_activity_library_id_fk" FOREIGN KEY ("activity_library_id") REFERENCES "public"."activity_library"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "activity_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"activity_id" uuid NOT NULL,
	"season_id" uuid,
	"charge_basis" "activity_charge_basis" DEFAULT 'per_person' NOT NULL,
	"rate" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "activity_rates" ADD CONSTRAINT "activity_rates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_rates" ADD CONSTRAINT "activity_rates_activity_id_activity_library_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity_library"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_rates" ADD CONSTRAINT "activity_rates_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activity_rates_org" ON "activity_rates" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_activity_rates_activity" ON "activity_rates" USING btree ("activity_id");
