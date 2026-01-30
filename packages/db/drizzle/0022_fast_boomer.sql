ALTER TABLE "proposal_notes" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "proposal_notes" ADD CONSTRAINT "proposal_notes_parent_id_proposal_notes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."proposal_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_proposal_notes_parent_id" ON "proposal_notes" USING btree ("parent_id");