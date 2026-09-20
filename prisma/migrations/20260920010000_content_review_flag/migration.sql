-- CreateTable
CREATE TABLE IF NOT EXISTS "ContentReviewFlag" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "matches" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "snippet" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,

    CONSTRAINT "ContentReviewFlag_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContentReviewFlag_status_reason_idx" ON "ContentReviewFlag"("status", "reason");
CREATE INDEX IF NOT EXISTS "ContentReviewFlag_targetType_targetId_idx" ON "ContentReviewFlag"("targetType", "targetId");
CREATE INDEX IF NOT EXISTS "ContentReviewFlag_createdAt_idx" ON "ContentReviewFlag"("createdAt");
