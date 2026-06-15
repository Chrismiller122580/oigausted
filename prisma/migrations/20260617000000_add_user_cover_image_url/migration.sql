-- Adds the `coverImageUrl` column to the User table.
-- This column was added to schema.prisma for the profile background/cover photo upload feature
-- (see /profile page and banner upload), but no migration was ever created/applied to production.
-- This caused "The column `User.coverImageUrl` does not exist in the current database."
-- errors on prisma.user.update() calls (e.g. become-seller from profile, and profile saves).
--
-- Using the safe/idempotent pattern (information_schema check + ALTER) used by other
-- catch-up migrations for User and PlatformConfig columns.
-- Harmless if the column already exists (e.g. after local db push).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name ILIKE 'user' 
      AND column_name ILIKE 'coverimageurl'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "coverImageUrl" TEXT;
  END IF;
END $$;
