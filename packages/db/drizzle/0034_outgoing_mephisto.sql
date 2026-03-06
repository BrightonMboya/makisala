ALTER TABLE "proposal_days" ADD COLUMN "destination_name" text;--> statement-breakpoint
ALTER TABLE "proposal_days" ADD COLUMN "destination_lat" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "proposal_days" ADD COLUMN "destination_lng" numeric(10, 7);