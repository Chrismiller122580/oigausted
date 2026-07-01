export const PWA_INSTALL_DISMISSED_KEY = 'pwa-install-dismissed-at'
export const PWA_MEANINGFUL_ACTION_KEY = 'pwa-meaningful-action'
export const PWA_INSTALL_ELIGIBLE_EVENT = 'pwa-install-eligible'

/** Re-prompt after 7 days if the user dismissed earlier. */
export const PWA_DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

import { isCapacitorNative } from '@/lib/capacitor-native'

export type PwaInstallPlatform = 'ios' | 'android-chrome'

/** @deprecated Use isCapacitorNative from capacitor-native */
export function isCapacitorNativeShell(): boolean {
  return isCapacitorNative()
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false
  if (isCapacitorNativeShell()) return true
  const standaloneMq = window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  return standaloneMq || iosStandalone
}

export function isMobileBrowser(): boolean {
  if (typeof window === 'undefined') return false
  return (
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    window.matchMedia('(max-width: 768px)').matches
  )
}

export function getPwaInstallPlatform(): PwaInstallPlatform | null {
  if (typeof window === 'undefined') return null
  if (isStandalonePwa()) return null

  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android-chrome'
  return null
}

export function recordMeaningfulPwaAction(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PWA_MEANINGFUL_ACTION_KEY, '1')
    window.dispatchEvent(new Event(PWA_INSTALL_ELIGIBLE_EVENT))
  } catch {
    // non-fatal
  }
}

export function hasMeaningfulPwaAction(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(PWA_MEANINGFUL_ACTION_KEY) === '1'
  } catch {
    return false
  }
}

export function markPwaInstallDismissed(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, String(Date.now()))
  } catch {
    // non-fatal
  }
}

export function isPwaInstallDismissed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(PWA_INSTALL_DISMISSED_KEY)
    if (!raw) return false
    const dismissedAt = Number(raw)
    if (!Number.isFinite(dismissedAt)) return true
    return Date.now() - dismissedAt < PWA_DISMISS_COOLDOWN_MS
  } catch {
    return false
  }
}

const TRIGGER_PATH_PREFIXES = [
  '/gigs',
  '/orders',
  '/messages',
  '/checkout',
  '/seller',
  '/profile',
] as const

export function isPwaTriggerPath(pathname: string): boolean {
  return TRIGGER_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export function canShowPwaInstallPrompt(pathname: string): boolean {
  if (typeof window === 'undefined') return false
  if (isCapacitorNative()) return false
  if (!isMobileBrowser()) return false
  if (isStandalonePwa()) return false
  if (pathname === '/login' || pathname === '/signup' || pathname.startsWith('/auth/')) return false
  if (isPwaInstallDismissed()) return false
  if (!getPwaInstallPlatform()) return false
  if (!hasMeaningfulPwaAction()) return false
  if (!isPwaTriggerPath(pathname)) return false
  return true
}

/** Lift the banner above buyer/seller mobile bottom navigation. */
export function pwaPromptOffsetClass(
  pathname: string,
  role?: string | null,
): string {
  if (role === 'buyer' || role === 'seller') return 'bottom-16'
  if (pathname.startsWith('/seller')) return 'bottom-16'
  return 'bottom-0'
}

export function getDefaultShareUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://oigagig.com'
}

export function buildWhatsAppShareUrl(text: string, url?: string): string {
  const message = url ? `${text} ${url}` : text
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}