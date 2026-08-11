-- Quote requests can now be started from a blank template (no tour). Relax
-- the FK to nullable and switch the delete behavior to set null, since a
-- deleted tour should no longer cascade-delete proposals that were seeded
-- from it (they've since diverged into their own itinerary data).
ALTER TABLE "proposals" DROP CONSTRAINT "proposals_tour_id_tours_id_fk";
ALTER TABLE "proposals" ALTER COLUMN "tour_id" DROP NOT NULL;
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE set null ON UPDATE no action;
