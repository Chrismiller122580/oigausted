-- Enhance AuditLog to capture ALL system changes (not just admin actions)
-- Add support for performedById (any user or null for system/webhooks)
-- Make adminId nullable for backward compat during transition

-- Add new columns (nullable for safety)
ALTER TABLE "AuditLog" ADD COLUMN "performedById" TEXT;

-- Make legacy adminId nullable (existing data keeps values)
ALTER TABLE "AuditLog" ALTER COLUMN "adminId" DROP NOT NULL;

-- Add index for the new actor field
CREATE INDEX "AuditLog_performedById_idx" ON "AuditLog"("performedById");

-- Note: The User.performedAuditLogs relation is virtual (no DB change needed)

-- Support tickets for all users to contact admin
CREATE TABLE IF NOT EXISTS "SupportTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "adminReply" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SupportTicket_userId_idx" ON "SupportTicket"("userId");
CREATE INDEX IF NOT EXISTS "SupportTicket_status_idx" ON "SupportTicket"("status");
CREATE INDEX IF NOT EXISTS "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");
