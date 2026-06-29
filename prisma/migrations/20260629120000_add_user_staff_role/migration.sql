-- Add additive staff role (marketplace role stays buyer/seller/admin)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "staffRole" TEXT;

-- Move staff roles off the marketplace role column
UPDATE "User"
SET "staffRole" = 'accountant', "role" = 'buyer'
WHERE "role" = 'accountant';

UPDATE "User"
SET "staffRole" = 'admin_assistant', "role" = 'buyer'
WHERE "role" = 'admin_assistant';