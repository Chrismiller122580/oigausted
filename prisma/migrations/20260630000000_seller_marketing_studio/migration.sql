-- Seller AI Marketing Studio: subscriptions, usage tracking, platform pricing

CREATE TABLE IF NOT EXISTS "SellerMarketingSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "expiresAt" TIMESTAMP(3),
    "wompiReference" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "adminOverride" TEXT,
    "adminNote" TEXT,
    "updatedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerMarketingSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SellerMarketingSubscription_userId_key" ON "SellerMarketingSubscription"("userId");
CREATE INDEX IF NOT EXISTS "SellerMarketingSubscription_tier_idx" ON "SellerMarketingSubscription"("tier");
CREATE INDEX IF NOT EXISTS "SellerMarketingSubscription_expiresAt_idx" ON "SellerMarketingSubscription"("expiresAt");

DO $$ BEGIN
  ALTER TABLE "SellerMarketingSubscription" ADD CONSTRAINT "SellerMarketingSubscription_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "SellerMarketingGeneration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gigId" TEXT,
    "channel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerMarketingGeneration_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SellerMarketingGeneration_userId_createdAt_idx" ON "SellerMarketingGeneration"("userId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "SellerMarketingGeneration" ADD CONSTRAINT "SellerMarketingGeneration_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "marketingStudioProPriceCOP" INTEGER NOT NULL DEFAULT 29900;
ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "marketingStudioFreeMonthlyLimit" INTEGER NOT NULL DEFAULT 3;