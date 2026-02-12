CREATE TYPE "public"."plan_tier" AS ENUM('free', 'starter', 'pro', 'business');--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "plan_tier" "plan_tier" DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "trial_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "polar_subscription_id" text;