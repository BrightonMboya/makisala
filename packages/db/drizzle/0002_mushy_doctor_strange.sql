CREATE TABLE "accommodation_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"accommodation_id" uuid NOT NULL,
	"language" text NOT NULL,
	"blocks" json DEFAULT '[]'::json NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"primary_color" text DEFAULT '#15803d',
	"notification_email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "proposals" DROP CONSTRAINT "proposals_tour_id_tours_id_fk";
--> statement-breakpoint
ALTER TABLE "proposals" ALTER COLUMN "tour_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "accommodations" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "accommodations" ADD COLUMN "latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "accommodations" ADD COLUMN "longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "accommodation_documents" ADD CONSTRAINT "accommodation_documents_accommodation_id_accommodations_id_fk" FOREIGN KEY ("accommodation_id") REFERENCES "public"."accommodations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;