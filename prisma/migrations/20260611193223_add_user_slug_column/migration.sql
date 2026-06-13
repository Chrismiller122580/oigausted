-- Adds the `slug` column (used for public seller profile URLs like /sellers/mi-negocio)
-- and its unique index.
--
-- This column was declared in schema.prisma (with @unique) but no prior migration
-- ever created it in the database (profile fields were added via early CREATE TABLE
-- snapshots + db push). Production databases are known to be missing it, which caused
-- 500 errors on every save from /seller/profile (and become-seller) because the
-- PATCH handler unconditionally wrote `slug` when businessName changed.
--
-- Using IF NOT EXISTS for safety on already-migrated or drifted DBs.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Unique index (nullable unique is allowed in Postgres for this use case)
CREATE UNIQUE INDEX IF NOT EXISTS "User_slug_key" ON "User"("slug");