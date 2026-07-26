import { prisma } from '@/lib/prisma'
import { devLog } from '@/lib/utils'

export const PUBLIC_PROFILE_GIG_LIMIT = 12

const publicGigInclude = {
  seller: {
    select: {
      id: true,
      name: true,
      email: true,
      businessName: true,
      slug: true,
      profilePicture: true,
      city: true,
    },
  },
} as const

export type PublicProfileGig = Awaited<ReturnType<typeof fetchPublicProfileGigs>>[number]

/** Gigs to display on a seller's public profile (showcase + active only). */
export async function fetchPublicProfileGigs(sellerId: string) {
  try {
    return await prisma.gig.findMany({
      where: {
        sellerId,
        isActive: true,
        deletedAt: null,
        showOnProfile: true,
      },
      include: publicGigInclude,
      orderBy: [{ profileShowcaseOrder: 'asc' }, { createdAt: 'desc' }],
      take: PUBLIC_PROFILE_GIG_LIMIT,
    })
  } catch (e) {
    devLog('Public profile gigs with showcase columns failed, falling back', e)
    return prisma.gig.findMany({
      where: {
        sellerId,
        isActive: true,
        deletedAt: null,
      },
      include: publicGigInclude,
      orderBy: { createdAt: 'desc' },
      take: PUBLIC_PROFILE_GIG_LIMIT,
    })
  }
}

export function isMissingShowcaseColumnError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return msg.includes('showOnProfile') || msg.includes('profileShowcaseOrder')
}