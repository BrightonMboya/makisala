-- proposals.organization_id was nullable with no default. A prior incident:
-- an org's proposal(s) had a null organization_id, which broke org-scoped
-- lookups (e.g. the Polar billing/trial unlock flow) and required a manual
-- data migration to fix. Every current insert path (proposals.save,
-- proposals.duplicate) already goes through protectedProcedure, which
-- guarantees ctx.orgId, so this only formalizes an invariant that already
-- holds - confirmed 0 rows with a null organization_id before this migration.
ALTER TABLE "proposals" ALTER COLUMN "organization_id" SET NOT NULL;
