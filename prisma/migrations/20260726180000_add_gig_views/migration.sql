-- Multi-visit gig interest tracking for buyer reminders
CREATE TABLE IF NOT EXISTS "GigView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gigId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 1,
    "firstViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reminderSentAt" TIMESTAMP(3),

    CONSTRAINT "GigView_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GigView_userId_gigId_key" ON "GigView"("userId", "gigId");
CREATE INDEX IF NOT EXISTS "GigView_userId_idx" ON "GigView"("userId");
CREATE INDEX IF NOT EXISTS "GigView_gigId_idx" ON "GigView"("gigId");
CREATE INDEX IF NOT EXISTS "GigView_viewCount_reminderSentAt_idx" ON "GigView"("viewCount", "reminderSentAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'GigView_userId_fkey'
  ) THEN
    ALTER TABLE "GigView"
      ADD CONSTRAINT "GigView_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'GigView_gigId_fkey'
  ) THEN
    ALTER TABLE "GigView"
      ADD CONSTRAINT "GigView_gigId_fkey"
      FOREIGN KEY ("gigId") REFERENCES "Gig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
