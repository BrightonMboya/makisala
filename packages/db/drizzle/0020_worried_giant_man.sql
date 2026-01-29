DROP TABLE "accommodation_content" CASCADE;--> statement-breakpoint
ALTER TABLE "accommodations" ADD COLUMN "enhanced_description" text;--> statement-breakpoint
ALTER TABLE "accommodations" ADD COLUMN "amenities" json;--> statement-breakpoint
ALTER TABLE "accommodations" ADD COLUMN "room_types" json;--> statement-breakpoint
ALTER TABLE "accommodations" ADD COLUMN "location_highlights" text[];--> statement-breakpoint
ALTER TABLE "accommodations" ADD COLUMN "pricing_info" text;--> statement-breakpoint
ALTER TABLE "accommodations" ADD COLUMN "content_status" "content_fetch_status" DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "accommodations" ADD COLUMN "content_last_fetched_at" timestamp;