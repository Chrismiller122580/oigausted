import {
  detectListingContactInfo,
  detectListingFieldsContact,
  LISTING_CONTACT_BLOCKED_MESSAGE,
  scrubListingText,
  scrubListingValue,
} from '@/lib/contact-moderation'

export function scrubPublicGig<T extends {
  title?: string
  description?: string | null
  fields?: unknown
  addons?: unknown
}>(gig: T): T {
  return {
    ...gig,
    title: gig.title != null ? scrubListingText(gig.title) || gig.title : gig.title,
    description: gig.description != null ? scrubListingText(gig.description) : gig.description,
    ...(gig.fields !== undefined ? { fields: scrubListingValue(gig.fields) } : {}),
    ...(gig.addons !== undefined ? { addons: scrubListingValue(gig.addons) } : {}),
  }
}

export function listingContactRejection(input: {
  title?: unknown
  description?: unknown
  fields?: unknown
  addons?: unknown
}): { error: string } | null {
  const texts = [input.title, input.description].filter((v): v is string => typeof v === 'string')
  const textHit = texts.map(detectListingContactInfo).find((r) => r.blocked)
  const fieldHit = detectListingFieldsContact([input.fields, input.addons])
  if (textHit || fieldHit.blocked) {
    return { error: LISTING_CONTACT_BLOCKED_MESSAGE }
  }
  return null
}
