ALTER TYPE "public"."proposal_status" ADD VALUE 'awaiting_payment';--> statement-breakpoint
ALTER TYPE "public"."proposal_status" ADD VALUE 'paid';--> statement-breakpoint
ALTER TYPE "public"."proposal_status" ADD VALUE 'booked';--> statement-breakpoint
ALTER TYPE "public"."proposal_status" ADD VALUE 'cancelled';