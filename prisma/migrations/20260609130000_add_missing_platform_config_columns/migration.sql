-- Safe (idempotent) migration to add columns to PlatformConfig that exist in the Prisma schema
-- but may be missing in the production database.
-- This prevents "column does not exist" errors on findUnique/findFirst for admin/config and reports.

DO $$
BEGIN
  -- Core fields added for growth, branding, notifications, wompi control etc.

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PlatformConfig' AND column_name = 'supportPhone') THEN
    ALTER TABLE "PlatformConfig" ADD COLUMN "supportPhone" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PlatformConfig' AND column_name = 'referralsEnabled') THEN
    ALTER TABLE "PlatformConfig" ADD COLUMN "referralsEnabled" BOOLEAN NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PlatformConfig' AND column_name = 'allowNewSignups') THEN
    ALTER TABLE "PlatformConfig" ADD COLUMN "allowNewSignups" BOOLEAN NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PlatformConfig' AND column_name = 'maxUploadSizeMB') THEN
    ALTER TABLE "PlatformConfig" ADD COLUMN "maxUploadSizeMB" INTEGER NOT NULL DEFAULT 10;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PlatformConfig' AND column_name = 'siteName') THEN
    ALTER TABLE "PlatformConfig" ADD COLUMN "siteName" TEXT NOT NULL DEFAULT 'OigaUsted';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PlatformConfig' AND column_name = 'siteTagline') THEN
    ALTER TABLE "PlatformConfig" ADD COLUMN "siteTagline" TEXT NOT NULL DEFAULT 'Conecta con profesionales locales en Colombia';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PlatformConfig' AND column_name = 'logoUrl') THEN
    ALTER TABLE "PlatformConfig" ADD COLUMN "logoUrl" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PlatformConfig' AND column_name = 'globalPushNotificationsEnabled') THEN
    ALTER TABLE "PlatformConfig" ADD COLUMN "globalPushNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PlatformConfig' AND column_name = 'globalEmailNotificationsEnabled') THEN
    ALTER TABLE "PlatformConfig" ADD COLUMN "globalEmailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PlatformConfig' AND column_name = 'maintenanceBypassIps') THEN
    ALTER TABLE "PlatformConfig" ADD COLUMN "maintenanceBypassIps" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PlatformConfig' AND column_name = 'wompiRealPaymentsEnabled') THEN
    ALTER TABLE "PlatformConfig" ADD COLUMN "wompiRealPaymentsEnabled" BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;
