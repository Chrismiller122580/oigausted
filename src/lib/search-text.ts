/**
 * Client-safe search helpers for buyer gig discovery.
 * Accent-insensitive matching, multi-field search, light relevance scoring.
 */

import { normalizeCityName } from '@/lib/colombia-cities'

/** Lowercase + strip diacritics for Spanish-friendly matching. */
export function normalizeSearchText(input: string | null | undefined): string {
  return (input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** True if haystack contains needle after normalization (empty needle = false). */
export function textIncludes(
  haystack: string | null | undefined,
  needle: string | null | undefined,
): boolean {
  const n = normalizeSearchText(needle)
  if (!n) return false
  return normalizeSearchText(haystack).includes(n)
}

/** Split query into tokens of length >= 2. */
export function tokenizeQuery(query: string | null | undefined): string[] {
  const n = normalizeSearchText(query)
  if (!n) return []
  return n.split(/[\s,./+\-_|]+/).filter((t) => t.length >= 2)
}

const NEAR_ME_LABELS = new Set([
  'cerca de mi',
  'cerca de mí',
  'cerca',
  'mi ubicacion',
  'mi ubicación',
  'near me',
])

/** Homepage / search bar “Cerca de mí” location values. */
export function isNearMeLocation(location: string | null | undefined): boolean {
  const n = normalizeSearchText(location)
  if (!n) return false
  if (NEAR_ME_LABELS.has(n)) return true
  return n.includes('cerca de mi') || n === 'cerca'
}

const REMOTE_TOKENS = new Set(['remoto', 'remota', 'online', 'virtual', 'a distancia', 'distancia'])

export function isRemoteQuery(query: string | null | undefined): boolean {
  const tokens = tokenizeQuery(query)
  if (tokens.some((t) => REMOTE_TOKENS.has(t))) return true
  const n = normalizeSearchText(query)
  return REMOTE_TOKENS.has(n) || n.includes('remoto') || n.includes('online')
}

export type SearchableGig = {
  title?: string | null
  description?: string | null
  category?: string | null
  city?: string | null
  isRemote?: boolean | null
  createdAt?: Date | string | null
  seller?: {
    name?: string | null
    businessName?: string | null
    city?: string | null
    rating?: number | null
    reviewCount?: number | null
  } | null
}

/** Whether a gig city/seller city matches the selected city filter. */
export function cityMatchesFilter(
  gig: SearchableGig,
  cityFilter: string | null | undefined,
): boolean {
  const filter = (cityFilter || '').trim()
  if (!filter || isNearMeLocation(filter)) return true

  const gigCity = (gig.city || '').trim()
  const sellerCity = (gig.seller?.city || '').trim()
  const candidates = [gigCity, sellerCity].filter(Boolean)

  if (candidates.length === 0) return false

  // Prefer canonical Colombia city match when possible
  const filterCity = normalizeCityName(filter)
  if (filterCity) {
    for (const c of candidates) {
      const resolved = normalizeCityName(c)
      if (resolved && resolved.id === filterCity.id) return true
      if (textIncludes(c, filterCity.label) || textIncludes(filterCity.label, c)) return true
      for (const alias of filterCity.aliases) {
        if (textIncludes(c, alias)) return true
      }
    }
  }

  // Fallback: substring match either way
  return candidates.some(
    (c) => textIncludes(c, filter) || textIncludes(filter, c),
  )
}

/**
 * Multi-field search: all significant tokens must match somewhere,
 * or the full query must match a single field (short queries).
 */
export function gigMatchesSearch(
  gig: SearchableGig,
  query: string | null | undefined,
): boolean {
  const q = (query || '').trim()
  if (!q) return true

  if (isRemoteQuery(q) && gig.isRemote) {
    // If query is only remote-related, match remotes; if mixed, still require other tokens below
    const tokens = tokenizeQuery(q).filter((t) => !REMOTE_TOKENS.has(t) && t !== 'a')
    if (tokens.length === 0) return true
  }

  const fields = [
    gig.title,
    gig.description,
    gig.category,
    gig.city,
    gig.seller?.businessName,
    gig.seller?.name,
    gig.seller?.city,
    gig.isRemote ? 'remoto online virtual' : '',
  ]

  const haystack = normalizeSearchText(fields.filter(Boolean).join(' '))
  if (!haystack) return false

  const full = normalizeSearchText(q)
  if (haystack.includes(full)) return true

  const tokens = tokenizeQuery(q)
  if (tokens.length === 0) return haystack.includes(full)

  // Every token must appear somewhere in the combined haystack
  return tokens.every((t) => haystack.includes(t))
}

export type RelevanceWeights = {
  titleFull: number
  titleToken: number
  category: number
  city: number
  seller: number
  description: number
  remote: number
  rating: number
  reviews: number
  recency: number
}

const DEFAULT_WEIGHTS: RelevanceWeights = {
  titleFull: 100,
  titleToken: 40,
  category: 50,
  city: 25,
  seller: 20,
  description: 10,
  remote: 15,
  rating: 8,
  reviews: 4,
  recency: 5,
}

/** Higher score = more relevant. Safe with empty query (returns 0). */
export function scoreGigRelevance(
  gig: SearchableGig,
  query: string | null | undefined,
  weights: Partial<RelevanceWeights> = {},
): number {
  const w = { ...DEFAULT_WEIGHTS, ...weights }
  const q = (query || '').trim()
  if (!q) return 0

  let score = 0
  const full = normalizeSearchText(q)
  const tokens = tokenizeQuery(q)

  if (textIncludes(gig.title, full)) score += w.titleFull
  else {
    for (const t of tokens) {
      if (textIncludes(gig.title, t)) score += w.titleToken
    }
  }

  if (textIncludes(gig.category, full) || tokens.some((t) => textIncludes(gig.category, t))) {
    score += w.category
  }

  if (
    textIncludes(gig.city, full) ||
    textIncludes(gig.seller?.city, full) ||
    tokens.some((t) => textIncludes(gig.city, t) || textIncludes(gig.seller?.city, t))
  ) {
    score += w.city
  }

  if (
    textIncludes(gig.seller?.businessName, full) ||
    textIncludes(gig.seller?.name, full) ||
    tokens.some(
      (t) =>
        textIncludes(gig.seller?.businessName, t) || textIncludes(gig.seller?.name, t),
    )
  ) {
    score += w.seller
  }

  if (textIncludes(gig.description, full) || tokens.some((t) => textIncludes(gig.description, t))) {
    score += w.description
  }

  if (isRemoteQuery(q) && gig.isRemote) score += w.remote

  const rating = gig.seller?.rating ?? 0
  const reviews = gig.seller?.reviewCount ?? 0
  if (rating > 0) score += (rating / 5) * w.rating
  if (reviews > 0) score += Math.min(reviews, 20) * (w.reviews / 20)

  if (gig.createdAt) {
    const created = new Date(gig.createdAt).getTime()
    if (!Number.isNaN(created)) {
      const ageDays = (Date.now() - created) / (1000 * 60 * 60 * 24)
      // Newer gigs: full recency boost if < 7 days, fades to 0 over ~90 days
      const recencyFactor = Math.max(0, 1 - ageDays / 90)
      score += recencyFactor * w.recency
    }
  }

  return score
}

/** Sort comparator: higher relevance first; stable fallback by title. */
export function compareByRelevance(
  a: SearchableGig,
  b: SearchableGig,
  query: string | null | undefined,
): number {
  const diff = scoreGigRelevance(b, query) - scoreGigRelevance(a, query)
  if (diff !== 0) return diff
  return (a.title || '').localeCompare(b.title || '', 'es')
}
