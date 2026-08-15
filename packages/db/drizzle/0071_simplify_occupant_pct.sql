-- Simplify occupant-slot pricing from 5 ordinal slots (3rd adult, 4th+ adult,
-- 1st child, 2nd child, 3rd+ child) to 2: one adult % and one child %, applied
-- uniformly to every occupant beyond the base double-occupancy rate. Existing
-- data never actually differentiated the ordinal slots (every row that had
-- both an adult slot set used the same % for both, same for child slots), so
-- this backfill is lossless - it just carries the value into the surviving
-- column before dropping the redundant ones.
UPDATE "accommodation_rates" SET "additional_adult_pct" = "third_adult_pct"
  WHERE "additional_adult_pct" IS NULL AND "third_adult_pct" IS NOT NULL;
UPDATE "accommodation_rates" SET "additional_child_pct" = "first_child_pct"
  WHERE "additional_child_pct" IS NULL AND "first_child_pct" IS NOT NULL;
ALTER TABLE "accommodation_rates" DROP COLUMN "third_adult_pct";
ALTER TABLE "accommodation_rates" DROP COLUMN "first_child_pct";
ALTER TABLE "accommodation_rates" DROP COLUMN "second_child_pct";
