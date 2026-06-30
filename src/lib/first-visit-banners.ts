import { getAnalyticsConsent } from '@/lib/analytics-consent'

export const HOMEPAGE_WELCOME_KEY = 'homepage-welcome-seen'
export const HOMEPAGE_WELCOME_DISMISSED_EVENT = 'homepage-welcome-dismissed'

export function hasSeenHomepageWelcome(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem(HOMEPAGE_WELCOME_KEY) === '1'
  } catch {
    return true
  }
}

export function markHomepageWelcomeSeen(): void {
  try {
    localStorage.setItem(HOMEPAGE_WELCOME_KEY, '1')
  } catch {
    // non-fatal
  }
  window.dispatchEvent(new Event(HOMEPAGE_WELCOME_DISMISSED_EVENT))
}

/** Cookie banner waits on landing until welcome modal is dismissed. */
export function canShowCookieConsent(pathname: string): boolean {
  if (getAnalyticsConsent() !== null) return false
  if (pathname === '/' && !hasSeenHomepageWelcome()) return false
  return true
}