import { track as vercelTrack } from '@vercel/analytics'
import { hasGoogleAnalyticsConsent } from '@/lib/analytics-consent'
import { GA_MEASUREMENT_ID } from '@/lib/ga-config'

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

/** Fires to Vercel Analytics always; GA4 only when user accepted analytics cookies. */
export function trackEvent(name: string, props?: AnalyticsEventProps): void {
  if (typeof window === 'undefined') return

  const payload = cleanProps(props)

  try {
    vercelTrack(name, payload)
  } catch {
    // Non-fatal: analytics must never break UX.
  }

  if (!GA_MEASUREMENT_ID || !hasGoogleAnalyticsConsent()) return

  const gtag = (window as GtagWindow).gtag
  if (typeof gtag !== 'function') return

  try {
    gtag('event', name, payload)
  } catch {
    // Non-fatal.
  }
}