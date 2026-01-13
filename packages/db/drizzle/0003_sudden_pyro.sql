ALTER TABLE "accommodation_documents" ALTER COLUMN "blocks" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "accommodation_documents" ALTER COLUMN "blocks" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "accommodation_images" ADD COLUMN "bucket" text NOT NULL;--> statement-breakpoint
ALTER TABLE "accommodation_images" ADD COLUMN "key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "accommodation_images" DROP COLUMN "image_url";