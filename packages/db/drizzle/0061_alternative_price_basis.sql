-- Backfill AccommodationAlternative.priceBasis from the free-text priceUnitLabel.
--
-- Before this, `priceBasis` was unset on every stored alternative (all 42 of
-- them) and the booking page treated an unset basis as flat. The unit the
-- client actually read came from `priceUnitLabel`, free text that was never an
-- input to the arithmetic: an alternative labelled "Per Person" at $300 with a
-- party of 4 displayed as a per-head upgrade and billed $300 once.
--
-- The label is the only record of intent for existing rows, so it becomes the
-- basis here. Going forward `priceBasis` is written on create and is the sole
-- input to both the charge and the label, so the two cannot diverge again.
--
--   'Per Person', 'Per person'                -> per_person  (17 rows)
--   'Per Room Per Night', 'Per room Per night'-> per_room     (8 rows)
--   'Total', 'In Total', null                 -> flat        (17 rows)
--
-- Per-night needs no basis: an alternative covers a single day row, so a
-- multi-night swap is already stored as one alternative per night.

UPDATE proposal_days
SET alternatives = (
  SELECT jsonb_agg(
    CASE
      -- Never overwrite an explicit choice, so this is safe to re-run.
      WHEN alt ? 'priceBasis' AND alt->>'priceBasis' IS NOT NULL THEN alt
      WHEN alt->>'priceUnitLabel' ~* 'per\s*(person|pax|adult|head)'
        THEN alt || '{"priceBasis":"per_person"}'::jsonb
      WHEN alt->>'priceUnitLabel' ~* 'per\s*room'
        THEN alt || '{"priceBasis":"per_room"}'::jsonb
      ELSE alt || '{"priceBasis":"flat"}'::jsonb
    END
    ORDER BY ord
  )::json
  FROM jsonb_array_elements(alternatives::jsonb) WITH ORDINALITY AS t(alt, ord)
)
WHERE alternatives IS NOT NULL
  AND jsonb_typeof(alternatives::jsonb) = 'array'
  AND jsonb_array_length(alternatives::jsonb) > 0;
