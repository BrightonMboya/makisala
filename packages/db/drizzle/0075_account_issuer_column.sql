-- Better Auth 1.7+: account identity is scoped by issuer.
-- https://better-auth.com/docs/guides/1-7-upgrade-guide#account-identity-is-scoped-by-issuer
--
-- Add nullable first so this is safe against the already-populated `account`
-- table, backfill per the upgrade guide's mapping, then enforce NOT NULL +
-- the compound uniqueness the guide recommends.

ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "issuer" text;

UPDATE "account" SET "issuer" = 'local:credential' WHERE "provider_id" = 'credential' AND "issuer" IS NULL;
UPDATE "account" SET "issuer" = 'https://accounts.google.com' WHERE "provider_id" = 'google' AND "issuer" IS NULL;

ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "account_issuer_accountId_uidx" ON "account" ("issuer", "account_id");
