import { prisma } from '@/lib/prisma'
import { GIG_VIEW_DEBOUNCE_MS } from '@/lib/gig-view-reminder'

export type PublicGigInterest = {
  viewCount: number
  likeCount: number
  liked: boolean
}

const emptyInterest: PublicGigInterest = { viewCount: 0, likeCount: 0, liked: false }

function isMissingInterestColumn(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return (
    msg.includes('viewCount') ||
    msg.includes('likeCount') ||
    msg.includes('GigLike') ||
    msg.includes('gig_likes')
  )
}

/** Bump the public page-view counter once per visitor window. */
export async function incrementPublicGigView(gigId: string): Promise<number | null> {
  try {
    const updated = await prisma.gig.update({
      where: { id: gigId },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    })
    return updated.viewCount
  } catch (err) {
    if (isMissingInterestColumn(err)) return null
    throw err
  }
}

export async function getGigInterest(
  gigId: string,
  userId?: string | null,
): Promise<PublicGigInterest> {
  try {
    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      select: { viewCount: true, likeCount: true },
    })
    if (!gig) return emptyInterest

    let liked = false
    if (userId) {
      const row = await prisma.gigLike.findUnique({
        where: { userId_gigId: { userId, gigId } },
        select: { id: true },
      })
      liked = Boolean(row)
    }

    return {
      viewCount: gig.viewCount ?? 0,
      likeCount: gig.likeCount ?? 0,
      liked,
    }
  } catch (err) {
    if (isMissingInterestColumn(err)) return emptyInterest
    throw err
  }
}

export async function toggleGigLike(
  userId: string,
  gigId: string,
): Promise<PublicGigInterest & { skipped?: string }> {
  const gig = await prisma.gig.findUnique({
    where: { id: gigId },
    select: { id: true, sellerId: true, isActive: true, deletedAt: true, viewCount: true, likeCount: true },
  })
  if (!gig || gig.deletedAt) {
    return { ...emptyInterest, skipped: 'gig unavailable' }
  }
  if (gig.sellerId === userId) {
    return {
      viewCount: gig.viewCount ?? 0,
      likeCount: gig.likeCount ?? 0,
      liked: false,
      skipped: 'own gig',
    }
  }

  const existing = await prisma.gigLike.findUnique({
    where: { userId_gigId: { userId, gigId } },
    select: { id: true },
  })

  if (existing) {
    await prisma.$transaction([
      prisma.gigLike.delete({ where: { id: existing.id } }),
      prisma.gig.update({
        where: { id: gigId },
        data: { likeCount: Math.max(0, (gig.likeCount ?? 1) - 1) },
      }),
    ])
    const next = await getGigInterest(gigId, userId)
    return { ...next, liked: false }
  }

  await prisma.$transaction([
    prisma.gigLike.create({ data: { userId, gigId } }),
    prisma.gig.update({
      where: { id: gigId },
      data: { likeCount: { increment: 1 } },
    }),
  ])
  const next = await getGigInterest(gigId, userId)
  return { ...next, liked: true }
}

export { GIG_VIEW_DEBOUNCE_MS }
