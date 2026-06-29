-- Inquiry messaging + contact moderation

-- User contact violation tracking
ALTER TABLE "User" ADD COLUMN "contactViolationCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "contactFlaggedAt" TIMESTAMP(3);

-- Pre-order inquiry threads (one per buyer per gig)
CREATE TABLE "InquiryThread" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "gigId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InquiryThread_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InquiryMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isFromBuyer" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquiryMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContactViolation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contextType" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "violationTypes" TEXT[] NOT NULL,
    "snippet" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactViolation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InquiryThread_buyerId_gigId_key" ON "InquiryThread"("buyerId", "gigId");
CREATE INDEX "InquiryThread_buyerId_idx" ON "InquiryThread"("buyerId");
CREATE INDEX "InquiryThread_sellerId_idx" ON "InquiryThread"("sellerId");
CREATE INDEX "InquiryThread_gigId_idx" ON "InquiryThread"("gigId");
CREATE INDEX "InquiryThread_updatedAt_idx" ON "InquiryThread"("updatedAt");

CREATE INDEX "InquiryMessage_threadId_idx" ON "InquiryMessage"("threadId");
CREATE INDEX "InquiryMessage_createdAt_idx" ON "InquiryMessage"("createdAt");

CREATE INDEX "ContactViolation_userId_idx" ON "ContactViolation"("userId");
CREATE INDEX "ContactViolation_contextType_contextId_idx" ON "ContactViolation"("contextType", "contextId");
CREATE INDEX "ContactViolation_createdAt_idx" ON "ContactViolation"("createdAt");

ALTER TABLE "InquiryThread" ADD CONSTRAINT "InquiryThread_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InquiryThread" ADD CONSTRAINT "InquiryThread_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InquiryThread" ADD CONSTRAINT "InquiryThread_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "Gig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InquiryMessage" ADD CONSTRAINT "InquiryMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "InquiryThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContactViolation" ADD CONSTRAINT "ContactViolation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;