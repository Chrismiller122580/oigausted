import { prisma } from '@/lib/prisma'
import {
  detectListingContactInfo,
  listingTextChanged,
  redactSnippet,
  scrubListingText,
  scrubListingValue,
} from '@/lib/contact-moderation'

export type ScrubHit = {
  surface: string
  id: string
  types: string[]
  snippet: string
}

export type ScrubReport = {
  dryRun: boolean
  scanned: Record<string, number>
  updated: Record<string, number>
  hits: ScrubHit[]
}

function parseMaybeJson(raw: string | null): { parsed: unknown; asString: boolean } {
  if (raw == null || !raw.trim()) return { parsed: raw, asString: false }
  try {
    return { parsed: JSON.parse(raw), asString: true }
  } catch {
    return { parsed: raw, asString: false }
  }
}

function stringifyMaybeJson(value: unknown, wasJson: boolean): string | null {
  if (value == null) return value as null
  if (wasJson) return JSON.stringify(value)
  return typeof value === 'string' ? value : JSON.stringify(value)
}

function collectTypes(...texts: Array<string | null | undefined>) {
  const types = new Set<string>()
  for (const text of texts) {
    if (!text) continue
    for (const t of detectListingContactInfo(text).types) types.add(t)
  }
  return [...types]
}

export async function scrubMarketplaceContacts(opts?: {
  dryRun?: boolean
  maxHits?: number
}): Promise<ScrubReport> {
  const dryRun = Boolean(opts?.dryRun)
  const maxHits = opts?.maxHits ?? 40
  const hits: ScrubHit[] = []
  const scanned = { gigs: 0, profiles: 0, reviews: 0, inquiries: 0, orderMessages: 0 }
  const updated = { gigs: 0, profiles: 0, reviews: 0, inquiries: 0, orderMessages: 0 }

  const pushHit = (hit: ScrubHit) => {
    if (hits.length < maxHits) hits.push(hit)
  }

  const gigs = await prisma.gig.findMany({
    select: { id: true, title: true, description: true, fields: true, addons: true },
  })
  scanned.gigs = gigs.length
  for (const gig of gigs) {
    const title = scrubListingText(gig.title) || gig.title
    const description = gig.description ? scrubListingText(gig.description) : gig.description
    const fieldsParsed = parseMaybeJson(gig.fields)
    const addonsParsed = parseMaybeJson(gig.addons)
    const fieldsValue = scrubListingValue(fieldsParsed.parsed)
    const addonsValue = scrubListingValue(addonsParsed.parsed)
    const fields = stringifyMaybeJson(fieldsValue, fieldsParsed.asString) as string | null
    const addons = stringifyMaybeJson(addonsValue, addonsParsed.asString) as string | null
    const types = collectTypes(gig.title, gig.description, gig.fields, gig.addons)
    const changed =
      listingTextChanged(gig.title, title) ||
      listingTextChanged(gig.description, description) ||
      listingTextChanged(gig.fields, fields) ||
      listingTextChanged(gig.addons, addons)
    if (!changed) continue
    pushHit({
      surface: 'gig',
      id: gig.id,
      types,
      snippet: redactSnippet(`${title} ${description || ''}`),
    })
    if (!dryRun) {
      await prisma.gig.update({
        where: { id: gig.id },
        data: { title, description, fields, addons },
      })
    }
    updated.gigs += 1
  }

  const profiles = await prisma.user.findMany({
    where: { OR: [{ role: 'seller' }, { bio: { not: null } }, { tagline: { not: null } }] },
    select: { id: true, bio: true, tagline: true },
  })
  scanned.profiles = profiles.length
  for (const user of profiles) {
    const bio = user.bio ? scrubListingText(user.bio) : user.bio
    const tagline = user.tagline ? scrubListingText(user.tagline) : user.tagline
    const changed = listingTextChanged(user.bio, bio) || listingTextChanged(user.tagline, tagline)
    if (!changed) continue
    pushHit({
      surface: 'profile',
      id: user.id,
      types: collectTypes(user.bio, user.tagline),
      snippet: redactSnippet(`${tagline || ''} ${bio || ''}`),
    })
    if (!dryRun) {
      await prisma.user.update({ where: { id: user.id }, data: { bio, tagline } })
    }
    updated.profiles += 1
  }

  const reviews = await prisma.review.findMany({
    where: { comment: { not: null } },
    select: { id: true, comment: true },
  })
  scanned.reviews = reviews.length
  for (const review of reviews) {
    const comment = review.comment ? scrubListingText(review.comment) : review.comment
    if (!listingTextChanged(review.comment, comment)) continue
    pushHit({
      surface: 'review',
      id: review.id,
      types: collectTypes(review.comment),
      snippet: redactSnippet(review.comment || ''),
    })
    if (!dryRun) {
      await prisma.review.update({ where: { id: review.id }, data: { comment } })
    }
    updated.reviews += 1
  }

  const inquiries = await prisma.inquiryMessage.findMany({
    select: { id: true, content: true },
  })
  scanned.inquiries = inquiries.length
  for (const msg of inquiries) {
    const content = scrubListingText(msg.content) || msg.content
    if (!listingTextChanged(msg.content, content)) continue
    pushHit({
      surface: 'inquiry',
      id: msg.id,
      types: collectTypes(msg.content),
      snippet: redactSnippet(msg.content),
    })
    if (!dryRun) {
      await prisma.inquiryMessage.update({ where: { id: msg.id }, data: { content } })
    }
    updated.inquiries += 1
  }

  const orderMessages = await prisma.orderMessage.findMany({
    select: { id: true, content: true },
  })
  scanned.orderMessages = orderMessages.length
  for (const msg of orderMessages) {
    const content = scrubListingText(msg.content) || msg.content
    if (!listingTextChanged(msg.content, content)) continue
    pushHit({
      surface: 'orderMessage',
      id: msg.id,
      types: collectTypes(msg.content),
      snippet: redactSnippet(msg.content),
    })
    if (!dryRun) {
      await prisma.orderMessage.update({ where: { id: msg.id }, data: { content } })
    }
    updated.orderMessages += 1
  }

  return { dryRun, scanned, updated, hits }
}
