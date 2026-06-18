-- Adds Order.sellerPayoutAt for admin payout tracking (/admin/payouts).
-- Schema had this field but it was never migrated (20260614000000 only added wompiPayoutRef).
-- Idempotent: safe if column already exists after db push.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name ILIKE 'order'
      AND column_name ILIKE 'sellerPayoutAt'
  ) THEN
    ALTER TABLE "Order" ADD COLUMN "sellerPayoutAt" TIMESTAMP(3);
  END IF;
END $$;