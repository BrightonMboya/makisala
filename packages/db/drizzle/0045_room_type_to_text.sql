ALTER TABLE "accommodation_rates"
  ALTER COLUMN "room_type" TYPE text USING "room_type"::text;

ALTER TABLE "proposal_accommodations"
  ALTER COLUMN "room_type" TYPE text USING "room_type"::text;

DROP TYPE "room_type";
