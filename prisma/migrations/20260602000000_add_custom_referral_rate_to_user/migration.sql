-- Add customReferralRate column to User table
-- This column was added to the Prisma schema for per-user referral commission rates
-- but the corresponding ALTER TABLE was missing from production migrations
-- (previous referral sync migration was a no-op baseline).

ALTER TABLE "User" ADD COLUMN "customReferralRate" DOUBLE PRECISION;
