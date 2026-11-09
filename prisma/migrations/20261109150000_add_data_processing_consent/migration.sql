-- Express data-processing consent (Ley 1581). Safe if columns already exist.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dataProcessingConsentAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dataProcessingConsentIp" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dataProcessingConsentVersion" TEXT;
