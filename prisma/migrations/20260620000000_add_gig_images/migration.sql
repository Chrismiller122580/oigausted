-- Adds the `images` column to the Gig table for multiple photo URLs (JSON array).
-- `imageUrl` remains as the primary/thumbnail (first image) for backward compatibility.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name ILIKE 'gig'
      AND column_name ILIKE 'images'
  ) THEN
    ALTER TABLE "Gig" ADD COLUMN "images" TEXT;
  END IF;
END $$;