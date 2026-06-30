/**
 * Capacitor native-shell bridge.
 * Active only when the app runs inside the iOS/Android wrapper (not mobile Safari).
 * OAuth token handoff and store signing are completed at release — see mobile/README.md.
 */

import { Capacitor } from '@capacitor/core'

const APP_SCHEME = 'oigagig'
const APP_HOST = 'app'
export const NATIVE_CALLBACK_PATH = '/auth/mobile-callback'

export function isCapacitorNative(): boolean {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform()
}

export function buildNativeDeepLink(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${APP_SCHEME}://${APP_HOST}${normalized}`
}

export function resolveDeepLinkPath(url: string): string | null {
  const prefixes = [
    `${APP_SCHEME}://${APP_HOST}`,
    `${APP_SCHEME}://`,
  ]

  for (const prefix of prefixes) {
    if (!url.startsWith(prefix)) continue
    const remainder = url.slice(prefix.length)
    if (!remainder || remainder === '/') return '/'
    return remainder.startsWith('/') ? remainder : `/${remainder}`
  }

  return null
}

export async function initCapacitorShell(): Promise<void> {
  if (!isCapacitorNative()) return

  const [{ SplashScreen }, { StatusBar, Style }, { App }] = await Promise.all([
    import('@capacitor/splash-screen'),
    import('@capacitor/status-bar'),
    import('@capacitor/app'),
  ])

  try {
    await SplashScreen.hide()
  } catch {
    // non-fatal
  }

  try {
    await StatusBar.setStyle({ style: Style.Default })
  } catch {
    // non-fatal
  }

  const navigateFromDeepLink = (incoming: string) => {
    const path = resolveDeepLinkPath(incoming)
    if (!path) return
    const target = new URL(path, window.location.origin)
    window.location.href = target.toString()
  }

  const launch = await App.getLaunchUrl()
  if (launch?.url) navigateFromDeepLink(launch.url)

  await App.addListener('appUrlOpen', (event) => {
    navigateFromDeepLink(event.url)
  })
}

export async function openExternalUrl(url: string): Promise<void> {
  if (!isCapacitorNative()) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }

  const { Browser } = await import('@capacitor/browser')
  await Browser.open({ url, presentationStyle: 'popover' })
}

/**
 * Google OAuth in embedded WebViews is blocked by Google.
 * Native shell opens the system browser; session handoff is finished at release time.
 */
export async function signInWithGoogle(callbackPath: string): Promise<void> {
  if (isCapacitorNative()) {
    const signInUrl = new URL('/api/auth/signin/google', window.location.origin)
    signInUrl.searchParams.set(
      'callbackUrl',
      buildNativeDeepLink(`${NATIVE_CALLBACK_PATH}?next=${encodeURIComponent(callbackPath)}`),
    )
    await openExternalUrl(signInUrl.toString())
    return
  }

  const { signIn } = await import('next-auth/react')
  await signIn('google', { callbackUrl: callbackPath })
}