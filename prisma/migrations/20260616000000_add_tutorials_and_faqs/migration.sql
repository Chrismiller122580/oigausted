-- Add tutorialsEnabled column to PlatformConfig (global on/off for user onboarding tutorials)
-- and create the FaqItem table for admin-managed, toggleable FAQs (with AI creation support in /admin/settings).
-- These power the new admin tools for "full training and support for new users" and turning FAQs on/off.
-- Written idempotently to be safe with the prisma-safe-migrate.sh flow.

-- PlatformConfig column (simple boolean with default, safe for existing singleton row)
ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "tutorialsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- New FaqItem table for dynamic FAQ content on /support
CREATE TABLE IF NOT EXISTS "FaqItem" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);
