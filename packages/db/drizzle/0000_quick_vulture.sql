CREATE TYPE "public"."commentStatus" AS ENUM('open', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."pageStatus" AS ENUM('published', 'draft');--> statement-breakpoint
CREATE TYPE "public"."pageType" AS ENUM('page', 'blog');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('draft', 'shared');--> statement-breakpoint
CREATE TABLE "accommodation_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"accommodation_id" uuid NOT NULL,
	"image_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accommodations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"overview" text
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"user_id" text,
	"user_name" text,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" text NOT NULL,
	"user_id" text,
	"user_name" text,
	"content" text NOT NULL,
	"pos_x" numeric(5, 2) NOT NULL,
	"pos_y" numeric(5, 2) NOT NULL,
	"width" numeric(5, 2),
	"height" numeric(5, 2),
	"status" "commentStatus" DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "destinations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"overall_page_url" text NOT NULL,
	"best_time_to_visit" text NOT NULL,
	"travel_advice" text NOT NULL,
	"destination_costs" text,
	"where_to_go" text
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fullName" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"country_of_residence" varchar(255) NOT NULL,
	"comments" text,
	"number_of_travellers" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"url" text
);
--> statement-breakpoint
CREATE TABLE "itineraries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tour_package_id" uuid NOT NULL,
	"day_number" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"estimated_driving_distance" text,
	"activities" text NOT NULL,
	"accommodation" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itinerary_accommodations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"itinerary_day_id" uuid NOT NULL,
	"accommodation_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itinerary_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tour_id" uuid NOT NULL,
	"day_number" integer NOT NULL,
	"itinerary_day_title" text,
	"overview" text,
	"national_park_id" uuid
);
--> statement-breakpoint
CREATE TABLE "modifiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "national_parks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"destination_id" uuid,
	"overview_page_id" text,
	"wildlife_page_id" text,
	"best_time_to_visit_id" text,
	"weather_page_id" text,
	"malaria_safety_page_id" text,
	"how_to_get_there_page_id" text,
	"wildlife_highlights" json,
	"park_overview" json,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"featured_image_url" text,
	"meta_title" text,
	"meta_description" text,
	"meta_keywords" text,
	"faqs" json,
	"page_type" "pageType" DEFAULT 'page',
	"status" "pageStatus" DEFAULT 'published',
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"data" json NOT NULL,
	"status" "proposal_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tour_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"number_of_days" integer NOT NULL,
	"slug" text,
	"country" varchar(100) NOT NULL,
	"destination" varchar(255) NOT NULL,
	"overview" text NOT NULL,
	"hero_image_url" text NOT NULL,
	"pricing_starts_from" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tour_name" text NOT NULL,
	"slug" text,
	"overview" text NOT NULL,
	"pricing" numeric(12, 2) NOT NULL,
	"country" text NOT NULL,
	"source_url" text NOT NULL,
	"activities" json NOT NULL,
	"top_features" json NOT NULL,
	"img_url" text NOT NULL,
	"number_of_days" integer NOT NULL,
	"tags" text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tours_tour_name_unique" UNIQUE("tour_name"),
	CONSTRAINT "tours_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "wildlife" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"excerpt" text NOT NULL,
	"description" text NOT NULL,
	"quick_facts" json,
	"where_to_see_description" text NOT NULL,
	"where_to_see_title" text
);
--> statement-breakpoint
CREATE TABLE "wildlife_park_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wildlife_id" uuid NOT NULL,
	"national_park_id" uuid NOT NULL,
	"where_to_see_title" text NOT NULL,
	"where_to_see_description" text NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"faqs" json,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accommodation_images" ADD CONSTRAINT "accommodation_images_accommodation_id_accommodations_id_fk" FOREIGN KEY ("accommodation_id") REFERENCES "public"."accommodations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_replies" ADD CONSTRAINT "comment_replies_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_replies" ADD CONSTRAINT "comment_replies_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_tour_package_id_tour_packages_id_fk" FOREIGN KEY ("tour_package_id") REFERENCES "public"."tour_packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_accommodations" ADD CONSTRAINT "itinerary_accommodations_itinerary_day_id_itinerary_days_id_fk" FOREIGN KEY ("itinerary_day_id") REFERENCES "public"."itinerary_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_accommodations" ADD CONSTRAINT "itinerary_accommodations_accommodation_id_accommodations_id_fk" FOREIGN KEY ("accommodation_id") REFERENCES "public"."accommodations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_days" ADD CONSTRAINT "itinerary_days_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_days" ADD CONSTRAINT "itinerary_days_national_park_id_national_parks_id_fk" FOREIGN KEY ("national_park_id") REFERENCES "public"."national_parks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "national_parks" ADD CONSTRAINT "national_parks_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "national_parks" ADD CONSTRAINT "national_parks_overview_page_id_pages_id_fk" FOREIGN KEY ("overview_page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "national_parks" ADD CONSTRAINT "national_parks_wildlife_page_id_pages_id_fk" FOREIGN KEY ("wildlife_page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "national_parks" ADD CONSTRAINT "national_parks_best_time_to_visit_id_pages_id_fk" FOREIGN KEY ("best_time_to_visit_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "national_parks" ADD CONSTRAINT "national_parks_weather_page_id_pages_id_fk" FOREIGN KEY ("weather_page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "national_parks" ADD CONSTRAINT "national_parks_malaria_safety_page_id_pages_id_fk" FOREIGN KEY ("malaria_safety_page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "national_parks" ADD CONSTRAINT "national_parks_how_to_get_there_page_id_pages_id_fk" FOREIGN KEY ("how_to_get_there_page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wildlife_park_overrides" ADD CONSTRAINT "wildlife_park_overrides_wildlife_id_wildlife_id_fk" FOREIGN KEY ("wildlife_id") REFERENCES "public"."wildlife"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wildlife_park_overrides" ADD CONSTRAINT "wildlife_park_overrides_national_park_id_national_parks_id_fk" FOREIGN KEY ("national_park_id") REFERENCES "public"."national_parks"("id") ON DELETE no action ON UPDATE no action;