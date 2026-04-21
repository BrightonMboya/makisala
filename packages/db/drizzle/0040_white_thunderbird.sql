ALTER TABLE "accommodations" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "accommodations" ADD CONSTRAINT "accommodations_slug_unique" UNIQUE("slug");