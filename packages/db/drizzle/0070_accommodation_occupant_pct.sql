-- Per-occupant-slot pricing for accommodation rates (per_person rates only).
-- perPaxRate remains the 1st/2nd-adult (double-occupancy) price; these columns
-- are optional % of perPaxRate for every occupant slot beyond that, matching
-- how hotel contracts commonly quote extra-adult and child discounts. All
-- null (the default) means "not modeled" - the pricing engine falls back to
-- charging every occupant the full perPaxRate, unchanged from today.
ALTER TABLE "accommodation_rates" ADD COLUMN "third_adult_pct" numeric(5, 2);
ALTER TABLE "accommodation_rates" ADD COLUMN "additional_adult_pct" numeric(5, 2);
ALTER TABLE "accommodation_rates" ADD COLUMN "first_child_pct" numeric(5, 2);
ALTER TABLE "accommodation_rates" ADD COLUMN "second_child_pct" numeric(5, 2);
ALTER TABLE "accommodation_rates" ADD COLUMN "additional_child_pct" numeric(5, 2);
