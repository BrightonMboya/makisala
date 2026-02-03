CREATE TYPE "public"."transport_mode" AS ENUM('road_4x4', 'road_shuttle', 'road_bus', 'flight_domestic', 'flight_bush');--> statement-breakpoint
CREATE TABLE "proposal_transportation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" text NOT NULL,
	"origin_name" text NOT NULL,
	"origin_id" uuid,
	"destination_name" text NOT NULL,
	"destination_id" uuid,
	"mode" "transport_mode" NOT NULL,
	"duration_minutes" integer,
	"distance_km" integer,
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proposal_transportation" ADD CONSTRAINT "proposal_transportation_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_transportation" ADD CONSTRAINT "proposal_transportation_origin_id_national_parks_id_fk" FOREIGN KEY ("origin_id") REFERENCES "public"."national_parks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_transportation" ADD CONSTRAINT "proposal_transportation_destination_id_national_parks_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."national_parks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_activities" DROP COLUMN "time";