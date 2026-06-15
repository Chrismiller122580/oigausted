-- Adds the `marketingEmails` column to NotificationPreference.
-- It was added to the Prisma schema (for opt-in marketing / system emails)
-- but was missed in the big "add_full_notification_preferences_columns" migration.
-- This was causing prisma.notificationPreference.create() (and upsert) to fail
-- with "The column `marketingEmails` does not exist in the current database."
-- on first load of notification preferences for users who had no row yet.
--
-- Safe idempotent pattern.

ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "marketingEmails" BOOLEAN NOT NULL DEFAULT true;
