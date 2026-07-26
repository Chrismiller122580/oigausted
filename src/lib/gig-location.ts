/** Shared helpers for displaying a gig's service location. */

export type GigLocationSource = {
  city?: string | null
  isRemote?: boolean | null
  seller?: {
    city?: string | null
  } | null
}

/**
 * Prefer the gig's own city, then the seller's city.
 * Remote gigs fall back to "Remoto / online" when no city is set.
 */
export function formatGigLocation(gig: GigLocationSource): string | null {
  const city = (gig.city || gig.seller?.city || '').trim()
  if (city) return city
  if (gig.isRemote) return 'Remoto / online'
  return null
}
