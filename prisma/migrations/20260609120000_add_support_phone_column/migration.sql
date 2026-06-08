-- Add supportPhone column to PlatformConfig (optional public support phone / WhatsApp)
-- This column was added to the schema but the migration was missing on production DB
ALTER TABLE "PlatformConfig" ADD COLUMN "supportPhone" TEXT;
