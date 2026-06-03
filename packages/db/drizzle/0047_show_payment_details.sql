-- Per-proposal toggle: reveal the operator's stored payment methods to the
-- client after they confirm. Off by default so payment details stay private.
ALTER TABLE "proposals"
  ADD COLUMN IF NOT EXISTS "show_payment_details" boolean DEFAULT false;
