-- Client-selectable add-ons on the booking page (/proposal/[id]/book).
--
-- Three things the client can now opt into at confirm time: an optional
-- activity, an alternative lodge for a night, or an extra. Alternatives and
-- extras already carried a price; optional activities did not (the pricing
-- engine skips them entirely), so they get one here.

-- Optional activities need a price before they can be added to a total.
-- Null price = operator never set one; the booking page shows it as
-- "on request" rather than guessing a number.
ALTER TABLE "proposal_activities"
  ADD COLUMN IF NOT EXISTS "price" numeric(12, 2);
ALTER TABLE "proposal_activities"
  ADD COLUMN IF NOT EXISTS "price_unit" text;

-- What the client picked, and the total that was quoted to them at the moment
-- they confirmed. Snapshotted because nothing stops the operator editing a
-- proposal after booking (same reason invoices snapshot payout methods).
ALTER TABLE "proposals"
  ADD COLUMN IF NOT EXISTS "client_selections" jsonb;
ALTER TABLE "proposals"
  ADD COLUMN IF NOT EXISTS "confirmed_total" numeric(12, 2);
ALTER TABLE "proposals"
  ADD COLUMN IF NOT EXISTS "confirmed_at" timestamp(3);
