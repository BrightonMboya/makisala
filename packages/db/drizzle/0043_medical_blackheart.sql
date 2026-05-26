CREATE TYPE "public"."rate_basis" AS ENUM('per_person', 'per_room');--> statement-breakpoint
ALTER TABLE "accommodation_rates" ADD COLUMN "rate_basis" "rate_basis" DEFAULT 'per_person' NOT NULL;--> statement-breakpoint
ALTER TABLE "accommodation_rates" ADD COLUMN "max_occupancy" integer;