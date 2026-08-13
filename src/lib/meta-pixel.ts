/** Official Meta Pixel ID for oigagig.com — public client value; env overrides default. */
export const DEFAULT_META_PIXEL_ID = '1064604162935356'

/** Meta Pixel ID — public client value; digits only. */
export function normalizeMetaPixelId(raw?: string | null): string {
  const value = raw?.trim() ?? ''
  return /^\d{5,20}$/.test(value) ? value : ''
}

export const META_PIXEL_ID =
  normalizeMetaPixelId(process.env.NEXT_PUBLIC_META_PIXEL_ID) || DEFAULT_META_PIXEL_ID

export type MetaPixelTrackKind = 'track' | 'trackCustom'

/** Maps internal funnel events to Meta standard events when possible. */
export const META_STANDARD_EVENT_MAP: Record<string, string> = {
  signup_completed: 'CompleteRegistration',
  checkout_started: 'InitiateCheckout',
  payment_initiated: 'AddPaymentInfo',
  payment_completed: 'Purchase',
  gig_created: 'Lead',
  become_seller: 'Lead',
}

export function resolveMetaPixelEvent(name: string): { kind: MetaPixelTrackKind; event: string } {
  const standard = META_STANDARD_EVENT_MAP[name]
  if (standard) return { kind: 'track', event: standard }
  return { kind: 'trackCustom', event: name }
}

export function toMetaPixelParams(
  name: string,
  props?: Record<string, string | number | boolean | undefined>,
): Record<string, string | number | boolean> | undefined {
  if (!props) return name === 'payment_completed' ? { currency: 'COP' } : undefined

  const cleaned: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) cleaned[key] = value
  }

  if (typeof cleaned.gig_category === 'string' && cleaned.content_category === undefined) {
    cleaned.content_category = cleaned.gig_category
  }

  if (name === 'payment_completed') {
    if (cleaned.currency === undefined) cleaned.currency = 'COP'
    if (cleaned.value === undefined && typeof cleaned.amount === 'number') {
      cleaned.value = cleaned.amount
    }
  }

  return Object.keys(cleaned).length > 0 ? cleaned : undefined
}

export function trackMetaPixelEvent(
  name: string,
  props?: Record<string, string | number | boolean | undefined>,
): void {
  if (typeof window === 'undefined') return
  if (!META_PIXEL_ID) return
  const fbq = window.fbq
  if (typeof fbq !== 'function') return

  const { kind, event } = resolveMetaPixelEvent(name)
  const params = toMetaPixelParams(name, props)

  try {
    if (params) fbq(kind, event, params)
    else fbq(kind, event)
  } catch {
    // Non-fatal: analytics must never break UX.
  }
}
