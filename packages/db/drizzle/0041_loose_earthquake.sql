CREATE TYPE "public"."meal_plan" AS ENUM('ro', 'bb', 'hb', 'fb', 'ai');--> statement-breakpoint
CREATE TYPE "public"."park_fee_category" AS ENUM('non_resident_adult', 'non_resident_child', 'east_african_resident_adult', 'east_african_resident_child', 'citizen_adult', 'citizen_child');--> statement-breakpoint
CREATE TYPE "public"."room_type" AS ENUM('single', 'double', 'triple', 'quad', 'family');--> statement-breakpoint
CREATE TYPE "public"."transfer_rate_mode" AS ENUM('per_vehicle', 'per_pax');--> statement-breakpoint
CREATE TABLE "accommodation_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"accommodation_id" uuid NOT NULL,
	"season_id" uuid NOT NULL,
	"room_type" "room_type" NOT NULL,
	"meal_plan" "meal_plan" NOT NULL,
	"per_pax_rate" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "park_fee_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"park_id" uuid NOT NULL,
	"season_id" uuid,
	"category" "park_fee_category" NOT NULL,
	"per_person_rate" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_settings" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"default_markup_pct" numeric(6, 2) DEFAULT '30' NOT NULL,
	"default_currency" text DEFAULT 'USD' NOT NULL,
	"default_traveler_category" "park_fee_category" DEFAULT 'non_resident_adult' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"start_month" integer NOT NULL,
	"start_day" integer NOT NULL,
	"end_month" integer NOT NULL,
	"end_day" integer NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfer_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"mode" "transfer_rate_mode" NOT NULL,
	"rate" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"capacity" integer NOT NULL,
	"per_day_rate" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proposal_accommodations" ADD COLUMN "room_type" "room_type";--> statement-breakpoint
ALTER TABLE "proposal_accommodations" ADD COLUMN "meal_plan" "meal_plan";--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "use_auto_pricing" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "vehicle_id" uuid;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "markup_pct" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "pickup_transfer_rate_id" uuid;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "dropoff_transfer_rate_id" uuid;--> statement-breakpoint
ALTER TABLE "accommodation_rates" ADD CONSTRAINT "accommodation_rates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accommodation_rates" ADD CONSTRAINT "accommodation_rates_accommodation_id_accommodations_id_fk" FOREIGN KEY ("accommodation_id") REFERENCES "public"."accommodations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accommodation_rates" ADD CONSTRAINT "accommodation_rates_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "park_fee_rates" ADD CONSTRAINT "park_fee_rates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "park_fee_rates" ADD CONSTRAINT "park_fee_rates_park_id_national_parks_id_fk" FOREIGN KEY ("park_id") REFERENCES "public"."national_parks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "park_fee_rates" ADD CONSTRAINT "park_fee_rates_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_settings" ADD CONSTRAINT "pricing_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_rates" ADD CONSTRAINT "transfer_rates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_accom_rate" ON "accommodation_rates" USING btree ("organization_id","accommodation_id","season_id","room_type","meal_plan");--> statement-breakpoint
CREATE INDEX "idx_accom_rates_org" ON "accommodation_rates" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_accom_rates_accom" ON "accommodation_rates" USING btree ("accommodation_id");--> statement-breakpoint
CREATE INDEX "idx_park_fee_org" ON "park_fee_rates" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_park_fee_park" ON "park_fee_rates" USING btree ("park_id");--> statement-breakpoint
CREATE INDEX "idx_seasons_org" ON "seasons" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_transfer_rates_org" ON "transfer_rates" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_vehicles_org" ON "vehicles" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_pickup_transfer_rate_id_transfer_rates_id_fk" FOREIGN KEY ("pickup_transfer_rate_id") REFERENCES "public"."transfer_rates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_dropoff_transfer_rate_id_transfer_rates_id_fk" FOREIGN KEY ("dropoff_transfer_rate_id") REFERENCES "public"."transfer_rates"("id") ON DELETE set null ON UPDATE no action;