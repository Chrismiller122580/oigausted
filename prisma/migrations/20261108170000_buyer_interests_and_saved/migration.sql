-- Buyer interest profile and saved gigs
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "buyerCity" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "buyerInterests" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "buyerUrgency" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "buyerPrefsAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "SavedGig" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "gigId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavedGig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SavedGig_userId_gigId_key" ON "SavedGig"("userId", "gigId");
CREATE INDEX IF NOT EXISTS "SavedGig_userId_idx" ON "SavedGig"("userId");
CREATE INDEX IF NOT EXISTS "SavedGig_gigId_idx" ON "SavedGig"("gigId");

DO $$ BEGIN
  ALTER TABLE "SavedGig" ADD CONSTRAINT "SavedGig_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SavedGig" ADD CONSTRAINT "SavedGig_gigId_fkey"
    FOREIGN KEY ("gigId") REFERENCES "Gig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
