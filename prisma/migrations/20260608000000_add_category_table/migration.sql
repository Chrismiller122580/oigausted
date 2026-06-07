-- Adds the Category table (and supporting indexes) which powers dynamic gig fields,
-- admin category management, and the public /api/categories endpoint used by
-- create-gig, gigs list, checkout, etc.
--
-- The table was defined in schema.prisma (model Category) but was never
-- created in the production Postgres database (only "category" TEXT columns
-- on Gig existed in early migrations). This caused P2021 errors on
-- prisma.category.findMany() / GET /api/categories.
--
-- Safe to run with IF NOT EXISTS for idempotency on drifted DBs.
-- After deploying this migration, run the seed (or visit admin/categories)
-- to populate the initial categories from src/lib/gig-categories.ts.

CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🛠️',
    "description" TEXT,
    "fields" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");

-- Optional: index commonly used in queries (isActive + order)
CREATE INDEX IF NOT EXISTS "Category_isActive_order_idx" ON "Category"("isActive", "order");