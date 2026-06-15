export const ANALYTICS_CONSENT_KEY = 'analytics_consent'

export type AnalyticsConsent = 'accepted' | 'essential'

export function getAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === 'undefined') return null
  const value = localStorage.getItem(ANALYTICS_CONSENT_KEY)
  return value === 'accepted' || value === 'essential' ? value : null
}

export function hasGoogleAnalyticsConsent(): boolean {
  return getAnalyticsConsent() === 'accepted'
}

export function setAnalyticsConsent(value: AnalyticsConsent): void {
  localStorage.setItem(ANALYTICS_CONSENT_KEY, value)
  window.dispatchEvent(new Event('analytics-consent-changed'))
}