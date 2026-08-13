import { track as vercelTrack } from '@vercel/analytics'
import { hasAnalyticsConsent } from '@/lib/analytics-consent'
import { GA_MEASUREMENT_ID } from '@/lib/ga-config'
import { trackMetaPixelEvent } from '@/lib/meta-pixel'

export type AnalyticsEventProps = Record<string, string | number | boolean | undefined>

type GtagWindow = Window & {
  gtag?: (...args: unknown[]) => void
}

function cleanProps(props?: AnalyticsEventProps): Record<string, string | number | boolean> | undefined {
  if (!props) return undefined
  const cleaned = Object.fromEntries(
    Object.entries(props).filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined)
  )
  return Object.keys(cleaned).length > 0 ? cleaned : undefined
}

/** Fires to Vercel Analytics always; GA4 + Meta Pixel only after cookie consent. */
export function trackEvent(name: string, props?: AnalyticsEventProps): void {
  if (typeof window === 'undefined') return

  const payload = cleanProps(props)

  try {
    vercelTrack(name, payload)
  } catch {
    // Non-fatal: analytics must never break UX.
  }

  if (!hasAnalyticsConsent()) return

  if (GA_MEASUREMENT_ID) {
    const gtag = (window as GtagWindow).gtag
    if (typeof gtag === 'function') {
      try {
        gtag('event', name, payload)
      } catch {
        // Non-fatal.
      }
    }
  }

  trackMetaPixelEvent(name, payload)
}
