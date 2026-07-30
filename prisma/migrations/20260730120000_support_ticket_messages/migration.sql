-- Threaded support messages (public replies + internal staff notes)
CREATE TABLE IF NOT EXISTS "SupportTicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "isStaff" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicketMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SupportTicketMessage_ticketId_createdAt_idx" ON "SupportTicketMessage"("ticketId", "createdAt");
CREATE INDEX IF NOT EXISTS "SupportTicketMessage_authorId_idx" ON "SupportTicketMessage"("authorId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SupportTicketMessage_ticketId_fkey'
  ) THEN
    ALTER TABLE "SupportTicketMessage"
      ADD CONSTRAINT "SupportTicketMessage_ticketId_fkey"
      FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SupportTicketMessage_authorId_fkey'
  ) THEN
    ALTER TABLE "SupportTicketMessage"
      ADD CONSTRAINT "SupportTicketMessage_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Backfill: original user message + last adminReply as staff public message
INSERT INTO "SupportTicketMessage" ("id", "ticketId", "authorId", "body", "isInternal", "isStaff", "createdAt")
SELECT
  md5(t."id" || ':user-origin') ,
  t."id",
  t."userId",
  t."message",
  false,
  false,
  t."createdAt"
FROM "SupportTicket" t
WHERE NOT EXISTS (
  SELECT 1 FROM "SupportTicketMessage" m WHERE m."ticketId" = t."id"
);

INSERT INTO "SupportTicketMessage" ("id", "ticketId", "authorId", "body", "isInternal", "isStaff", "createdAt")
SELECT
  md5(t."id" || ':admin-reply'),
  t."id",
  t."resolvedBy",
  t."adminReply",
  false,
  true,
  COALESCE(t."updatedAt", t."createdAt")
FROM "SupportTicket" t
WHERE t."adminReply" IS NOT NULL
  AND length(trim(t."adminReply")) > 0
  AND NOT EXISTS (
    SELECT 1 FROM "SupportTicketMessage" m
    WHERE m."ticketId" = t."id" AND m."isStaff" = true AND m."isInternal" = false
  );
