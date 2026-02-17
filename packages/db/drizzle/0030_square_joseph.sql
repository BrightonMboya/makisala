CREATE TABLE "proposal_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" text NOT NULL,
	"user_id" text NOT NULL,
	"assigned_by" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accommodations" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "proposal_assignments" ADD CONSTRAINT "proposal_assignments_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_assignments" ADD CONSTRAINT "proposal_assignments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_assignments" ADD CONSTRAINT "proposal_assignments_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_assignments_proposal_user_idx" ON "proposal_assignments" USING btree ("proposal_id","user_id");--> statement-breakpoint
CREATE INDEX "proposal_assignments_proposal_idx" ON "proposal_assignments" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "proposal_assignments_user_idx" ON "proposal_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_organizations_polar_subscription_id" ON "organizations" USING btree ("polar_subscription_id");--> statement-breakpoint
CREATE INDEX "idx_organizations_trial_ends_at" ON "organizations" USING btree ("trial_ends_at");