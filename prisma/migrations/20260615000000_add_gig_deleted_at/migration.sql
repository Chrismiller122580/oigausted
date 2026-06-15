-- Add soft-delete support for gigs in admin moderation.
-- Allows admins to delete (soft), edit, and restore gigs via /admin/gigs.
-- Column is nullable; existing gigs will have NULL (treated as not deleted).

ALTER TABLE "Gig" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
