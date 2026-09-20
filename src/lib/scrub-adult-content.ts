import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { detectAdultContent, detectAdultFields } from '@/lib/adult-content-moderation'
import { redactSnippet } from '@/lib/contact-moderation'
import { notifyAdminsAdultContent } from '@/lib/admin-notifications'

export type AdultScanHit = {
  surface: string
  id: string
  matches: string[]
  snippet: string
  flagged: boolean
}

export type AdultScanReport = {
  dryRun: boolean
  scanned: Record<string, number>
  flagged: Record<string, number>
  hits: AdultScanHit[]
}

function snippetOf(...parts: Array<string | null | undefined>) {
  return redactSnippet(parts.filter(Boolean).join(' ').slice(0, 280))
}

async function upsertPendingFlag(input: {
  targetType: string
  targetId: string
  matches: string[]
  snippet: string
  dryRun: boolean
}) {
  if (input.dryRun) return { created: false }
  const existing = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "ContentReviewFlag"
    WHERE "targetType" = ${input.targetType}
      AND "targetId" = ${input.targetId}
      AND reason = 'adult'
      AND status = 'pending'
    LIMIT 1
  `
  if (existing.length) return { created: false }
  const id = randomUUID()
  const matchesLiteral = `{${input.matches.map((m) => `"${m.replace(/"/g, '')}"`).join(',')}}`
  await prisma.$executeRaw`
    INSERT INTO "ContentReviewFlag"
      (id, "targetType", "targetId", reason, matches, snippet, status, "createdAt")
    VALUES
      (${id}, ${input.targetType}, ${input.targetId}, 'adult', ${matchesLiteral}::text[], ${input.snippet}, 'pending', NOW())
  `
  return { created: true }
}

export async function scanAndFlagAdultContent(opts?: {
  dryRun?: boolean
  maxHits?: number
}): Promise<AdultScanReport> {
  const dryRun = Boolean(opts?.dryRun)
  const maxHits = opts?.maxHits ?? 40
  const hits: AdultScanHit[] = []
  const scanned = { gigs: 0, profiles: 0, reviews: 0 }
  const flagged = { gigs: 0, profiles: 0, reviews: 0 }

  const pushHit = (hit: AdultScanHit) => {
    if (hits.length < maxHits) hits.push(hit)
  }

  const gigs = await prisma.gig.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      title: true,
      description: true,
      fields: true,
      addons: true,
      isActive: true,
      seller: { select: { name: true, email: true, businessName: true } },
    },
  })
  scanned.gigs = gigs.length
  for (const gig of gigs) {
    const textHit = detectAdultContent(`${gig.title}\n${gig.description || ''}`)
    const fieldHit = detectAdultFields([gig.fields, gig.addons])
    const matches = [...new Set([...textHit.matches, ...fieldHit.matches])]
    if (!matches.length) continue
    const snippet = snippetOf(gig.title, gig.description)
    pushHit({ surface: 'gig', id: gig.id, matches, snippet, flagged: true })
    flagged.gigs += 1
    const created = await upsertPendingFlag({
      targetType: 'gig',
      targetId: gig.id,
      matches,
      snippet,
      dryRun,
    })
    if (!dryRun && gig.isActive) {
      await prisma.gig.update({
        where: { id: gig.id },
        data: { isActive: false },
      })
    }
    if (!dryRun && created.created) {
      try {
        await notifyAdminsAdultContent({
          targetType: 'gig',
          targetId: gig.id,
          title: gig.title,
          matches,
          snippet,
          sellerName: gig.seller?.businessName || gig.seller?.name,
          sellerEmail: gig.seller?.email,
        })
      } catch {
        // notification failure must not stop the scan
      }
    }
  }

  const profiles = await prisma.user.findMany({
    where: { OR: [{ role: 'seller' }, { bio: { not: null } }, { tagline: { not: null } }] },
    select: { id: true, bio: true, tagline: true, name: true, email: true, businessName: true },
  })
  scanned.profiles = profiles.length
  for (const user of profiles) {
    const hit = detectAdultContent(`${user.tagline || ''}\n${user.bio || ''}`)
    if (!hit.flagged) continue
    const snippet = snippetOf(user.tagline, user.bio)
    pushHit({ surface: 'profile', id: user.id, matches: hit.matches, snippet, flagged: true })
    flagged.profiles += 1
    const created = await upsertPendingFlag({
      targetType: 'profile',
      targetId: user.id,
      matches: hit.matches,
      snippet,
      dryRun,
    })
    if (!dryRun && created.created) {
      try {
        await notifyAdminsAdultContent({
          targetType: 'profile',
          targetId: user.id,
          title: user.businessName || user.name || user.email || user.id,
          matches: hit.matches,
          snippet,
          sellerName: user.businessName || user.name,
          sellerEmail: user.email,
        })
      } catch {
        // ignore
      }
    }
  }

  const reviews = await prisma.review.findMany({
    where: { comment: { not: null } },
    select: { id: true, comment: true },
  })
  scanned.reviews = reviews.length
  for (const review of reviews) {
    const hit = detectAdultContent(review.comment)
    if (!hit.flagged) continue
    const snippet = snippetOf(review.comment)
    pushHit({ surface: 'review', id: review.id, matches: hit.matches, snippet, flagged: true })
    flagged.reviews += 1
    await upsertPendingFlag({
      targetType: 'review',
      targetId: review.id,
      matches: hit.matches,
      snippet,
      dryRun,
    })
  }

  return { dryRun, scanned, flagged, hits }
}
