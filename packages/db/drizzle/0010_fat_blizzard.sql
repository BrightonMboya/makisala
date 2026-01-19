ALTER TABLE "tours" DROP CONSTRAINT "tours_tour_name_unique";--> statement-breakpoint
ALTER TABLE "tours" DROP CONSTRAINT "tours_slug_unique";--> statement-breakpoint
ALTER TABLE "tours" ALTER COLUMN "source_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "cloned_from_id" uuid;--> statement-breakpoint
ALTER TABLE "tours" ADD CONSTRAINT "tours_cloned_from_id_tours_id_fk" FOREIGN KEY ("cloned_from_id") REFERENCES "public"."tours"("id") ON DELETE set null ON UPDATE no action;