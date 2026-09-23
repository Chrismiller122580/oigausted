import {
  detectListingContactInfo,
  detectListingFieldsContact,
  LISTING_CONTACT_BLOCKED_MESSAGE,
  scrubListingText,
  scrubListingValue,
} from '@/lib/contact-moderation'
import { listingAdultRejection } from '@/lib/adult-content-moderation'
import { looksLikeStreetAddress } from '@/lib/public-location'

function scrubAddressFields(value: unknown): unknown {
  if (!Array.isArray(value)) return value
  return value.filter((field) => {
    if (!field || typeof field !== 'object') return true
    const rec = field as { key?: unknown; label?: unknown; value?: unknown }
    const key = String(rec.key || '').toLowerCase()
    const label = String(rec.label || '').toLowerCase()
    if (key === 'address' || key === 'direccion' || key === 'dirección') return false
    if (/direcci[oó]n/.test(label)) return false
    if (typeof rec.value === 'string' && looksLikeStreetAddress(rec.value)) return false
    return true
  })
}

export function scrubPublicGig<T extends {
  title?: string
  description?: string | null
  fields?: unknown
  addons?: unknown
  city?: string | null
}>(gig: T): T {
  return {
    ...gig,
    title: gig.title != null ? scrubListingText(gig.title) || gig.title : gig.title,
    description: gig.description != null ? scrubListingText(gig.description) : gig.description,
    ...(gig.fields !== undefined ? { fields: scrubAddressFields(scrubListingValue(gig.fields)) } : {}),
    ...(gig.addons !== undefined ? { addons: scrubListingValue(gig.addons) } : {}),
  }
}

export function listingContactRejection(input: {
  title?: unknown
  description?: unknown
  fields?: unknown
  addons?: unknown
}): { error: string } | null {
  const adult = listingAdultRejection(input)
  if (adult) return adult
  const texts = [input.title, input.description].filter((v): v is string => typeof v === 'string')
  const textHit = texts.map(detectListingContactInfo).find((r) => r.blocked)
  const fieldHit = detectListingFieldsContact([input.fields, input.addons])
  if (textHit || fieldHit.blocked) {
    return { error: LISTING_CONTACT_BLOCKED_MESSAGE }
  }
  return null
}
