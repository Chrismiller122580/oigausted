-- Correct the public support email from support@support.oigagig.com to support@oigagig.com
-- Updates the PlatformConfig singleton and aligns the column default for new rows.

UPDATE "PlatformConfig"
SET "supportEmail" = 'support@oigagig.com'
WHERE "supportEmail" = 'support@support.oigagig.com'
   OR "supportEmail" IS NULL
   OR TRIM("supportEmail") = '';

ALTER TABLE "PlatformConfig" ALTER COLUMN "supportEmail" SET DEFAULT 'support@oigagig.com';