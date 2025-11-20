ALTER TABLE "national_parks" DROP CONSTRAINT "national_parks_destination_id_destinations_id_fk";
--> statement-breakpoint
ALTER TABLE "national_parks" DROP COLUMN "destination_id";