-- Expand only. Unknown legacy tenants remain explicitly unclassified.
-- No default, inferred backfill, row replacement or credential rotation.
BEGIN;
CREATE TYPE "BusinessVertical" AS ENUM ('BEAUTY', 'DENTAL', 'FITNESS', 'AUTOMOTIVE');
ALTER TABLE "Establishment"
  ADD COLUMN "vertical" "BusinessVertical",
  ADD COLUMN "verticalConfiguredAt" TIMESTAMPTZ(3),
  ADD COLUMN "verticalConfigurationReason" VARCHAR(500);
COMMIT;
