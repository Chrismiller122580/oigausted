-- Store print shop contact details provided by the buyer at checkout
ALTER TABLE "DocumentRequest" ADD COLUMN IF NOT EXISTS "printShopName" TEXT;
ALTER TABLE "DocumentRequest" ADD COLUMN IF NOT EXISTS "printShopPhone" TEXT;