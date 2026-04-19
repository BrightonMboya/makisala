CREATE TABLE "proposal_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" text NOT NULL,
	"language" text NOT NULL,
	"content" json NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "language" text DEFAULT 'en';--> statement-breakpoint
ALTER TABLE "proposal_translations" ADD CONSTRAINT "proposal_translations_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_translations_proposal_lang_idx" ON "proposal_translations" USING btree ("proposal_id","language");