CREATE TYPE "public"."day_type" AS ENUM('arrival', 'full_day', 'half_day', 'departure');--> statement-breakpoint
CREATE TABLE "day_content_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"national_park_id" uuid NOT NULL,
	"day_type" "day_type" NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "day_content_templates" ADD CONSTRAINT "day_content_templates_national_park_id_national_parks_id_fk" FOREIGN KEY ("national_park_id") REFERENCES "public"."national_parks"("id") ON DELETE cascade ON UPDATE no action;