-- Adds the MarketingCampaign table for admin email broadcast history.
-- The model existed in schema.prisma but was never migrated to production Postgres,
-- causing P2021 / 500 errors on GET /api/admin/marketing/campaigns and on broadcast create.
--
-- Safe to run with IF NOT EXISTS for idempotency on drifted DBs.

CREATE TABLE IF NOT EXISTS "MarketingCampaign" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MarketingCampaign_createdAt_idx" ON "MarketingCampaign"("createdAt");
CREATE INDEX IF NOT EXISTS "MarketingCampaign_sentById_idx" ON "MarketingCampaign"("sentById");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'MarketingCampaign_sentById_fkey'
  ) THEN
    ALTER TABLE "MarketingCampaign"
      ADD CONSTRAINT "MarketingCampaign_sentById_fkey"
      FOREIGN KEY ("sentById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;