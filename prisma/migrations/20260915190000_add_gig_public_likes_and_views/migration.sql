-- Public pre-service idea likes + view counters on gigs.
-- Idempotent for prisma-safe-migrate.sh / existing prod columns.

ALTER TABLE "Gig" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Gig" ADD COLUMN IF NOT EXISTS "likeCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "GigLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gigId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GigLike_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GigLike_userId_gigId_key" ON "GigLike"("userId", "gigId");
CREATE INDEX IF NOT EXISTS "GigLike_gigId_idx" ON "GigLike"("gigId");
CREATE INDEX IF NOT EXISTS "GigLike_userId_idx" ON "GigLike"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'GigLike_userId_fkey'
  ) THEN
    ALTER TABLE "GigLike"
      ADD CONSTRAINT "GigLike_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'GigLike_gigId_fkey'
  ) THEN
    ALTER TABLE "GigLike"
      ADD CONSTRAINT "GigLike_gigId_fkey"
      FOREIGN KEY ("gigId") REFERENCES "Gig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
