CREATE TABLE "activity_library" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"organization_id" uuid,
	"is_global" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "countries" text[];--> statement-breakpoint
ALTER TABLE "activity_library" ADD CONSTRAINT "activity_library_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "activity_library" ("name", "is_global") VALUES
  ('Game Drive', true),
  ('Gorilla Trekking', true),
  ('Golden Monkey Trekking', true),
  ('Boat Cruise', true),
  ('Nature Walk', true),
  ('Cultural Tour', true),
  ('Bird Watching', true),
  ('Chimpanzee Trekking', true),
  ('City Tour', true),
  ('Canopy Walk', true);