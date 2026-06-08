-- Add supportPhone column (safe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PlatformConfig' AND column_name = 'supportPhone') THEN
    ALTER TABLE "PlatformConfig" ADD COLUMN "supportPhone" TEXT;
  END IF;
END $$;
