ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "countries" text[];--> statement-breakpoint
UPDATE "tours" SET "countries" = ARRAY["country"] WHERE "countries" IS NULL;
