-- Add wompiRealPaymentsEnabled column to PlatformConfig for admin-controlled real/live payments toggle
ALTER TABLE "PlatformConfig" ADD COLUMN "wompiRealPaymentsEnabled" BOOLEAN NOT NULL DEFAULT false;
