-- Operator-selected display currency for a proposal's pricing (USD/EUR).
-- Display-only: no conversion, the operator enters amounts already in this
-- currency. Existing proposals default to USD, matching today's behavior.
ALTER TABLE "proposals" ADD COLUMN "currency" text NOT NULL DEFAULT 'USD';
