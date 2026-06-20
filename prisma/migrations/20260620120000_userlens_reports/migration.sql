-- UserLens scan reports and Composer fix queue
CREATE TABLE IF NOT EXISTS "UserLensReport" (
    "id" TEXT NOT NULL,
    "scannedById" TEXT,
    "url" TEXT NOT NULL,
    "scanUrl" TEXT,
    "finalUrl" TEXT NOT NULL,
    "title" TEXT,
    "viewport" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL,
    "loadTimeMs" INTEGER NOT NULL,
    "summary" JSONB,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserLensReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "UserLensFixItem" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "category" TEXT,
    "auditId" TEXT,
    "severity" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targets" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserLensFixItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UserLensReport_scannedAt_idx" ON "UserLensReport"("scannedAt");
CREATE INDEX IF NOT EXISTS "UserLensReport_finalUrl_idx" ON "UserLensReport"("finalUrl");
CREATE INDEX IF NOT EXISTS "UserLensReport_scannedById_idx" ON "UserLensReport"("scannedById");
CREATE INDEX IF NOT EXISTS "UserLensFixItem_reportId_idx" ON "UserLensFixItem"("reportId");
CREATE INDEX IF NOT EXISTS "UserLensFixItem_status_idx" ON "UserLensFixItem"("status");
CREATE INDEX IF NOT EXISTS "UserLensFixItem_severity_idx" ON "UserLensFixItem"("severity");
CREATE INDEX IF NOT EXISTS "UserLensFixItem_createdAt_idx" ON "UserLensFixItem"("createdAt");

ALTER TABLE "UserLensReport" DROP CONSTRAINT IF EXISTS "UserLensReport_scannedById_fkey";
ALTER TABLE "UserLensReport" ADD CONSTRAINT "UserLensReport_scannedById_fkey" FOREIGN KEY ("scannedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserLensFixItem" DROP CONSTRAINT IF EXISTS "UserLensFixItem_reportId_fkey";
ALTER TABLE "UserLensFixItem" ADD CONSTRAINT "UserLensFixItem_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "UserLensReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserLensFixItem" DROP CONSTRAINT IF EXISTS "UserLensFixItem_reviewedById_fkey";
ALTER TABLE "UserLensFixItem" ADD CONSTRAINT "UserLensFixItem_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;