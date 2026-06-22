import type { Prisma } from '@prisma/client'

/** Gigs visible on the marketplace, home page, and public search. */
export function publicGigWhere(): Prisma.GigWhereInput {
  return { isActive: true, deletedAt: null }
}

/** Fallback when deletedAt column is not yet migrated. */
export function publicGigWhereFallback(): Prisma.GigWhereInput {
  return { isActive: true }
}

export function isMissingDeletedAtColumn(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return msg.includes('deletedAt')
}