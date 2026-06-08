-- Add resendEmailId for reliable email delivery correlation (Resend webhooks)
-- This column is nullable to support gradual rollout.

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "resendEmailId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Notification_resendEmailId_key" ON "Notification"("resendEmailId");
