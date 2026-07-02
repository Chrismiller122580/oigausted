-- Buro de Documentos — Presentado por OigaGIG
-- DocumentRequest, DocumentLearnedRequest, PlatformConfig document fields

-- PlatformConfig document studio settings
ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "documentStudioEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "documentPrintShopEmail" TEXT DEFAULT 'impresion@oigagig.com';
ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "documentBasePriceCOP" INTEGER NOT NULL DEFAULT 15000;
ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "documentCustomPriceCOP" INTEGER NOT NULL DEFAULT 25000;
ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "documentLearnThreshold" INTEGER NOT NULL DEFAULT 3;

-- DocumentLearnedRequest: tracks custom doc types users request (learning loop)
CREATE TABLE IF NOT EXISTS "DocumentLearnedRequest" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "rawDescription" TEXT NOT NULL,
    "categoryHint" TEXT,
    "sampleFields" JSONB,
    "aiPromptHint" TEXT,
    "requestCount" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'learning',
    "lastRequestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentLearnedRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DocumentLearnedRequest_slug_key" ON "DocumentLearnedRequest"("slug");
CREATE INDEX IF NOT EXISTS "DocumentLearnedRequest_status_idx" ON "DocumentLearnedRequest"("status");
CREATE INDEX IF NOT EXISTS "DocumentLearnedRequest_requestCount_idx" ON "DocumentLearnedRequest"("requestCount");
CREATE INDEX IF NOT EXISTS "DocumentLearnedRequest_lastRequestedAt_idx" ON "DocumentLearnedRequest"("lastRequestedAt");

-- DocumentRequestStatus enum
DO $$ BEGIN
  CREATE TYPE "DocumentRequestStatus" AS ENUM ('Draft', 'PendingPayment', 'Paid', 'Completed', 'Failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- DocumentRequest: individual buyer document orders
CREATE TABLE IF NOT EXISTS "DocumentRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "customDescription" TEXT,
    "customFields" JSONB NOT NULL DEFAULT '{}',
    "generatedContent" JSONB,
    "editedContent" JSONB,
    "priceCOP" DOUBLE PRECISION NOT NULL,
    "status" "DocumentRequestStatus" NOT NULL DEFAULT 'Draft',
    "wompiReference" TEXT,
    "pdfUrl" TEXT,
    "printShopEmail" TEXT,
    "buyerEmail" TEXT NOT NULL,
    "learnedRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DocumentRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DocumentRequest_wompiReference_key" ON "DocumentRequest"("wompiReference");
CREATE INDEX IF NOT EXISTS "DocumentRequest_userId_idx" ON "DocumentRequest"("userId");
CREATE INDEX IF NOT EXISTS "DocumentRequest_status_idx" ON "DocumentRequest"("status");
CREATE INDEX IF NOT EXISTS "DocumentRequest_templateId_idx" ON "DocumentRequest"("templateId");
CREATE INDEX IF NOT EXISTS "DocumentRequest_learnedRequestId_idx" ON "DocumentRequest"("learnedRequestId");

DO $$ BEGIN
  ALTER TABLE "DocumentRequest" ADD CONSTRAINT "DocumentRequest_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DocumentRequest" ADD CONSTRAINT "DocumentRequest_learnedRequestId_fkey"
    FOREIGN KEY ("learnedRequestId") REFERENCES "DocumentLearnedRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;