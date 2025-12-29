CREATE TABLE "proposal_accommodations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_day_id" uuid NOT NULL,
	"accommodation_id" uuid NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_day_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"location" text,
	"moment" text NOT NULL,
	"is_optional" boolean DEFAULT false NOT NULL,
	"image_url" text,
	"time" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" text NOT NULL,
	"day_number" integer NOT NULL,
	"title" text,
	"description" text,
	"national_park_id" uuid,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_day_id" uuid NOT NULL,
	"breakfast" boolean DEFAULT false NOT NULL,
	"lunch" boolean DEFAULT false NOT NULL,
	"dinner" boolean DEFAULT false NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "proposal_meals_proposal_day_id_unique" UNIQUE("proposal_day_id")
);
--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "tour_id" uuid;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "client_name" text;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "tour_title" text;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "tour_type" text;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "start_date" timestamp(3);--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "start_city" text;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "pickup_point" text;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "transfer_included" text;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "pricing_rows" json;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "extras" json;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "traveler_groups" json;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "inclusions" text[];--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "exclusions" text[];--> statement-breakpoint
ALTER TABLE "proposal_accommodations" ADD CONSTRAINT "proposal_accommodations_proposal_day_id_proposal_days_id_fk" FOREIGN KEY ("proposal_day_id") REFERENCES "public"."proposal_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_accommodations" ADD CONSTRAINT "proposal_accommodations_accommodation_id_accommodations_id_fk" FOREIGN KEY ("accommodation_id") REFERENCES "public"."accommodations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_activities" ADD CONSTRAINT "proposal_activities_proposal_day_id_proposal_days_id_fk" FOREIGN KEY ("proposal_day_id") REFERENCES "public"."proposal_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_days" ADD CONSTRAINT "proposal_days_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_days" ADD CONSTRAINT "proposal_days_national_park_id_national_parks_id_fk" FOREIGN KEY ("national_park_id") REFERENCES "public"."national_parks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_meals" ADD CONSTRAINT "proposal_meals_proposal_day_id_proposal_days_id_fk" FOREIGN KEY ("proposal_day_id") REFERENCES "public"."proposal_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" DROP COLUMN "data";