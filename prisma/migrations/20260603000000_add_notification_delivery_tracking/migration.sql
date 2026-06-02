-- Add delivery tracking columns to Notification table.
-- These were added to the Prisma schema (emailStatus, pushStatus, deliveryLog, etc.)
-- but the corresponding ALTER TABLEs were missing from production (baseline sync
-- migration was a no-op). This caused 500 errors on /api/notifications and
-- preferences queries (column does not exist).
-- Using IF NOT EXISTS for safety on re-runs.

ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "emailStatus" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "emailSentAt" TIMESTAMP(3);
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "emailOpenedAt" TIMESTAMP(3);
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "pushStatus" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "pushSentAt" TIMESTAMP(3);
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "pushClickedAt" TIMESTAMP(3);
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "deliveryLog" JSONB;

-- Indexes (IF NOT EXISTS is Postgres 9.5+)
CREATE INDEX IF NOT EXISTS "Notification_emailStatus_idx" ON "Notification"("emailStatus");
CREATE INDEX IF NOT EXISTS "Notification_pushStatus_idx" ON "Notification"("pushStatus");
