DROP TABLE "accommodation_documents" CASCADE;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "theme" text DEFAULT 'minimalistic';--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "hero_image" text;