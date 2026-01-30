CREATE TABLE "proposal_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" text NOT NULL,
	"user_id" text,
	"user_name" text,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proposal_notes" ADD CONSTRAINT "proposal_notes_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_notes" ADD CONSTRAINT "proposal_notes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accommodations" DROP COLUMN "content_status";--> statement-breakpoint
ALTER TABLE "accommodations" DROP COLUMN "content_last_fetched_at";--> statement-breakpoint
DROP TYPE "public"."content_fetch_status";