-- Adds seller payout bank details (on User) and wompiPayoutRef (on Order).
-- These support the new "pay sellers using Wompi" flow in /admin/payouts:
--   - Sellers fill bank info (bank code, account #, holder, document, etc.) so admin knows where to send net payouts.
--   - Admin "Pagar con Wompi" records the Wompi payout/transfer reference (from Wompi Pagos a Terceros dashboard or API)
--     on the order for audit, seller notifications, and reconciliation (alongside SFTP reports if used).
--
-- Uses the same safe/idempotent DO $$ IF NOT EXISTS pattern as recent catch-up migrations
-- (e.g. 20260613000000_add_wompi_sftp_columns, 20260609130000) so it is harmless if columns
-- already exist (e.g. after `db push` or prior manual add).
--
-- After deploy, run `npx prisma migrate deploy` (or apply this SQL via your DB provider dashboard)
-- against the production Postgres DATABASE_URL. The code has fallbacks for missing columns.

DO $$
BEGIN
  -- User bank/payout details (nullable; seller configures in /seller/earnings)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'payoutBankCode') THEN
    ALTER TABLE "User" ADD COLUMN "payoutBankCode" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'payoutAccountNumber') THEN
    ALTER TABLE "User" ADD COLUMN "payoutAccountNumber" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'payoutAccountType') THEN
    ALTER TABLE "User" ADD COLUMN "payoutAccountType" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'payoutHolderName') THEN
    ALTER TABLE "User" ADD COLUMN "payoutHolderName" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'payoutDocumentType') THEN
    ALTER TABLE "User" ADD COLUMN "payoutDocumentType" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'payoutDocumentNumber') THEN
    ALTER TABLE "User" ADD COLUMN "payoutDocumentNumber" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'payoutPhone') THEN
    ALTER TABLE "User" ADD COLUMN "payoutPhone" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'payoutEmail') THEN
    ALTER TABLE "User" ADD COLUMN "payoutEmail" TEXT;
  END IF;

  -- Order: Wompi-specific payout reference for the seller disbursement (nullable)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'wompiPayoutRef') THEN
    ALTER TABLE "Order" ADD COLUMN "wompiPayoutRef" TEXT;
  END IF;
END $$;
