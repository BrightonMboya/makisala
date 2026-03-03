ALTER TYPE "public"."proposal_status" ADD VALUE 'accepted';--> statement-breakpoint
ALTER TYPE "public"."proposal_status" ADD VALUE 'completed';--> statement-breakpoint
CREATE INDEX "idx_proposals_org_status" ON "proposals" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_proposals_org_start_date" ON "proposals" USING btree ("organization_id","start_date");