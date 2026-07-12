-- Engagement counters for email analytics. Additive only.
ALTER TABLE "email_messages" ADD COLUMN IF NOT EXISTS "open_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "email_messages" ADD COLUMN IF NOT EXISTS "click_count" integer DEFAULT 0 NOT NULL;
