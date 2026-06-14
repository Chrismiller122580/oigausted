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
  -- Use ILIKE + public schema for robustness across different Postgres casing behaviors
  -- and after previous `db push` or manual adds.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name ILIKE 'user' 
      AND column_name ILIKE 'payoutbankcode'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "payoutBankCode" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name ILIKE 'user' 
      AND column_name ILIKE 'payoutaccountnumber'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "payoutAccountNumber" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name ILIKE 'user' 
      AND column_name ILIKE 'payoutaccounttype'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "payoutAccountType" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name ILIKE 'user' 
      AND column_name ILIKE 'payoutholdername'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "payoutHolderName" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name ILIKE 'user' 
      AND column_name ILIKE 'payoutdocumenttype'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "payoutDocumentType" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name ILIKE 'user' 
      AND column_name ILIKE 'payoutdocumentnumber'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "payoutDocumentNumber" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name ILIKE 'user' 
      AND column_name ILIKE 'payoutphone'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "payoutPhone" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name ILIKE 'user' 
      AND column_name ILIKE 'payoutemail'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "payoutEmail" TEXT;
  END IF;

  -- Order: Wompi-specific payout reference for the seller disbursement (nullable)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name ILIKE 'order' 
      AND column_name ILIKE 'wompiPayoutRef'
  ) THEN
    ALTER TABLE "Order" ADD COLUMN "wompiPayoutRef" TEXT;
  END IF;
END $$;
