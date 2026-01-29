CREATE TYPE "public"."content_fetch_status" AS ENUM('pending', 'fetching', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "accommodation_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"accommodation_id" uuid NOT NULL,
	"enhanced_description" text,
	"amenities" json,
	"room_types" json,
	"location_highlights" text[],
	"pricing_info" text,
	"status" "content_fetch_status" DEFAULT 'pending' NOT NULL,
	"last_fetched_at" timestamp,
	"fetch_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accommodation_content_accommodation_id_unique" UNIQUE("accommodation_id")
);
--> statement-breakpoint
ALTER TABLE "accommodation_content" ADD CONSTRAINT "accommodation_content_accommodation_id_accommodations_id_fk" FOREIGN KEY ("accommodation_id") REFERENCES "public"."accommodations"("id") ON DELETE cascade ON UPDATE no action;