-- Enhance AuditLog to capture ALL system changes (not just admin actions)
-- Add support for performedById (any user or null for system/webhooks)
-- Make adminId nullable for backward compat during transition

-- Add performedById column if it doesn't exist (idempotent for recovery)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AuditLog' AND column_name = 'performedById'
    ) THEN
        ALTER TABLE "AuditLog" ADD COLUMN "performedById" TEXT;
    END IF;
END $$;

-- Make legacy adminId nullable if not already (safe to run multiple times in practice)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AuditLog' AND column_name = 'adminId' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "AuditLog" ALTER COLUMN "adminId" DROP NOT NULL;
    END IF;
END $$;

-- Add index for the new actor field if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'AuditLog_performedById_idx' AND n.nspname = 'public'
    ) THEN
        CREATE INDEX "AuditLog_performedById_idx" ON "AuditLog"("performedById");
    END IF;
END $$;

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
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SupportTicket_userId_idx" ON "SupportTicket"("userId");
CREATE INDEX IF NOT EXISTS "SupportTicket_status_idx" ON "SupportTicket"("status");
CREATE INDEX IF NOT EXISTS "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");
