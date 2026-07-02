-- DocumentTemplate: admin-managed catalog
CREATE TABLE IF NOT EXISTS "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '📄',
    "categoryHint" TEXT NOT NULL DEFAULT 'custom',
    "fields" JSONB NOT NULL DEFAULT '[]',
    "aiPromptHint" TEXT NOT NULL,
    "basePriceCOP" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'admin',
    "learnedRequestId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DocumentTemplate_slug_key" ON "DocumentTemplate"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentTemplate_learnedRequestId_key" ON "DocumentTemplate"("learnedRequestId");
CREATE INDEX IF NOT EXISTS "DocumentTemplate_isActive_idx" ON "DocumentTemplate"("isActive");
CREATE INDEX IF NOT EXISTS "DocumentTemplate_order_idx" ON "DocumentTemplate"("order");
CREATE INDEX IF NOT EXISTS "DocumentTemplate_source_idx" ON "DocumentTemplate"("source");