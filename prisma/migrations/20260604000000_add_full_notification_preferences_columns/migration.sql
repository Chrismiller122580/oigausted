-- Add missing columns to NotificationPreference table.
-- The Prisma model was expanded with many preference fields (quiet hours, digest, granular alerts, etc.)
-- but production DB table was missing them (causing 500s on /api/user/notification-preferences
-- and also on gig publish because sendInApp does prefs lookup which fails).
-- Using IF NOT EXISTS for idempotency / safe re-runs on Postgres.

ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "desktopNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "soundEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "quietHoursStart" TEXT;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "quietHoursEnd" TEXT;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "digestEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "digestFrequency" TEXT NOT NULL DEFAULT 'daily';
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "maxNotificationsPerHour" INTEGER NOT NULL DEFAULT 8;

-- Also ensure core ones exist (in case very old baseline)
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "inAppEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "emailEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "smsEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "pushEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "orderUpdates" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "gigUpdates" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "reviewAlerts" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "paymentAlerts" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "messageAlerts" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "systemAlerts" BOOLEAN NOT NULL DEFAULT true;

-- createdAt / updatedAt are usually there from initial, but for safety
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Note: id, userId are assumed to exist from baseline.
