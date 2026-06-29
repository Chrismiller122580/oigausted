import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { devLog, isUuidIdentifier, slugify } from '@/lib/utils'

/** Public seller profile — no contact fields exposed to buyers. */
export const publicSellerSelect = {
  id: true,
  name: true,
  businessName: true,
  bio: true,
  profilePicture: true,
  slug: true,
} as const

export const sellerByIdSelect = publicSellerSelect

export const sellerBySlugSelect = {
  ...publicSellerSelect,
} as const

export type SellerProfile = {
  id: string
  name: string | null
  businessName: string | null
  bio: string | null
  profilePicture: string | null
  slug?: string | null
}

type SellerBySlugRow = Prisma.UserGetPayload<{ select: typeof sellerBySlugSelect }>

/** True when `candidate` is an exact slug or a safe numeric suffix (-N or trailing digits). */
export function isSlugPrefixMatch(requested: string, candidate: string): boolean {
  if (!requested || !candidate) return false
  if (candidate === requested) return true
  if (!candidate.startsWith(requested)) return false
  const rest = candidate.slice(requested.length)
  return /^\d+$/.test(rest) || /^-\d+$/.test(rest)
}

export function canonicalSellerPath(seller: SellerProfile): string {
  return seller.slug || seller.id
}

/**
 * Resolve a public seller profile by slug, UUID id, or close slug alias
 * (e.g. /sellers/cortland-blackstone-sas → stored slug cortland-blackstone-sas404).
 */
export async function findSellerBySlugOrId(identifier: string): Promise<SellerProfile | null> {
  if (!identifier) return null

  const normalized = decodeURIComponent(identifier).trim().toLowerCase()
  const isUuid = isUuidIdentifier(normalized)

  if (isUuid) {
    try {
      const seller = await prisma.user.findUnique({
        where: { id: normalized },
        select: sellerBySlugSelect,
      })
      if (seller) return seller
    } catch (e) {
      devLog('Seller find by id failed (possible schema)', e)
    }
  }

  try {
    const seller = await prisma.user.findUnique({
      where: { slug: normalized },
      select: sellerBySlugSelect,
    })
    if (seller) return seller
  } catch (e) {
    devLog('Seller find by slug failed (column may be missing in prod DB - run prisma migrate deploy)', e)
  }

  try {
    const prefixMatches = await prisma.user.findMany({
      where: { slug: { startsWith: normalized } },
      select: sellerBySlugSelect,
      take: 8,
    })
    const aliasMatches = prefixMatches.filter(
      (s: SellerBySlugRow) => s.slug && isSlugPrefixMatch(normalized, s.slug)
    )
    if (aliasMatches.length === 1) return aliasMatches[0]
    const exact = aliasMatches.find((s: SellerBySlugRow) => s.slug === normalized)
    if (exact) return exact
  } catch (e) {
    devLog('Seller find by slug prefix failed', e)
  }

  try {
    const tokens = normalized.split('-').filter(Boolean)
    if (tokens.length >= 2) {
      const nameHint = tokens.slice(0, Math.min(tokens.length, 4)).join(' ')
      const candidates = await prisma.user.findMany({
        where: {
          businessName: { contains: nameHint, mode: 'insensitive' },
          gigs: { some: {} },
        },
        select: sellerBySlugSelect,
        take: 12,
      })
      const bizMatches = candidates.filter((s: SellerBySlugRow) => {
        const derived = slugify(s.businessName || '')
        return derived && isSlugPrefixMatch(normalized, derived)
      })
      if (bizMatches.length === 1) return bizMatches[0]
      const exactBiz = bizMatches.find(
        (s: SellerBySlugRow) => slugify(s.businessName || '') === normalized
      )
      if (exactBiz) return exactBiz
    }
  } catch (e) {
    devLog('Seller find by businessName slug failed', e)
  }

  if (!isUuid) {
    try {
      const seller = await prisma.user.findUnique({
        where: { id: normalized },
        select: sellerBySlugSelect,
      })
      if (seller) return seller
    } catch (e) {
      devLog('Seller find by id fallback failed', e)
    }
  }

  return null
}