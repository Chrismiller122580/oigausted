-- Allow sellers to curate which gigs appear on their public profile
ALTER TABLE "Gig" ADD COLUMN "showOnProfile" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Gig" ADD COLUMN "profileShowcaseOrder" INTEGER;