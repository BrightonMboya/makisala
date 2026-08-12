-- A proposal can be flagged as a reusable template: client-stripped, shown on
-- /tours instead of the live pipeline, cloned back into a real proposal via
-- the same logic as `duplicate` when an operator sends it to a client.
ALTER TABLE "proposals" ADD COLUMN "is_template" boolean DEFAULT false NOT NULL;
