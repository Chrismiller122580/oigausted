-- Adds Wompi SFTP/FTPS columns to PlatformConfig.
-- These columns were added to schema.prisma (for automated settlement report downloads,
-- reconciliation, etc.) but no migration had been created yet, causing 500s on PUT /api/admin/config
-- when admins toggled or saved SFTP settings (or on any upsert that returns full rows).
--
-- Uses the same safe/idempotent DO $$ pattern as prior catch-up migrations
-- (e.g. 20260609130000_add_missing_platform_config_columns) so it is harmless
-- if run against DBs that already have the columns (after a db push or earlier manual add).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PlatformConfig' AND column_name = 'wompiSftpEnabled') THEN
    ALTER TABLE "PlatformConfig" ADD COLUMN "wompiSftpEnabled" BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PlatformConfig' AND column_name = 'wompiSftpHost') THEN
    ALTER TABLE "PlatformConfig" ADD COLUMN "wompiSftpHost" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PlatformConfig' AND column_name = 'wompiSftpPort') THEN
    ALTER TABLE "PlatformConfig" ADD COLUMN "wompiSftpPort" INTEGER DEFAULT 22;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PlatformConfig' AND column_name = 'wompiSftpUsername') THEN
    ALTER TABLE "PlatformConfig" ADD COLUMN "wompiSftpUsername" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PlatformConfig' AND column_name = 'wompiSftpPassword') THEN
    ALTER TABLE "PlatformConfig" ADD COLUMN "wompiSftpPassword" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PlatformConfig' AND column_name = 'wompiSftpPrivateKey') THEN
    ALTER TABLE "PlatformConfig" ADD COLUMN "wompiSftpPrivateKey" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PlatformConfig' AND column_name = 'wompiSftpRemotePath') THEN
    ALTER TABLE "PlatformConfig" ADD COLUMN "wompiSftpRemotePath" TEXT DEFAULT '/';
  END IF;
END $$;
