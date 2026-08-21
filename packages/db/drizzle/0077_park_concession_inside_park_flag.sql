-- Conditions the Tarangire/Lake Manyara hotel concession fee on the night's
-- accommodation actually sitting inside the park (vs. a Karatu-based lodge
-- day-tripping in). Additive only. Hand-run against the shared dev DB,
-- matching existing practice (see 0076).

ALTER TABLE "accommodations" ADD COLUMN IF NOT EXISTS "is_inside_park" boolean NOT NULL DEFAULT false;

ALTER TABLE "park_ancillary_fees" ADD COLUMN IF NOT EXISTS "requires_inside_park" boolean NOT NULL DEFAULT false;
