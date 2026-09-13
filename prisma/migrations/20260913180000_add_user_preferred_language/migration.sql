-- Preferred language for outbound email / push / in-app copy.
-- Safe on production (IF NOT EXISTS). Defaults to Spanish for existing users.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT NOT NULL DEFAULT 'es';
