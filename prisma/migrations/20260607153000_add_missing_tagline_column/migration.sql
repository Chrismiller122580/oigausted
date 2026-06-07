-- This migration adds the `tagline` column to the User table.
-- 
-- The column was present in early profile-related migrations (e.g. 20260428...)
-- and was re-added to schema.prisma to support the "Tagline or profession" field
-- in user profiles.
--
-- However, the production Postgres database was missing the column,
-- which caused PrismaClientKnownRequestError during Google OAuth login
-- (the next-auth jwt callback does a findUnique with tagline in the select).
--
-- This migration is safe to run on production (uses IF NOT EXISTS).

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tagline" TEXT;
