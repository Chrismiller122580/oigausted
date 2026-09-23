import { formatPublicCityCountry } from '@/lib/public-location'

/** Shared helpers for displaying a gig's service location. */

export type GigLocationSource = {
  city?: string | null
  isRemote?: boolean | null
  seller?: {
    city?: string | null
  } | null
}

/**
 * Public location only: city + Colombia.
 * Street addresses and GPS strings are stripped.
 */
export function formatGigLocation(gig: GigLocationSource): string | null {
  return formatPublicCityCountry(gig.city || gig.seller?.city || '', gig.isRemote)
}
