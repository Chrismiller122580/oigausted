/**
 * Capacitor native-shell bridge.
 * Active only when the app runs inside the iOS/Android wrapper (not mobile Safari).
 * Store signing and marketplace metadata are completed at release — see mobile/README.md.
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

async function configureNativeChrome(): Promise<void> {
  const { StatusBar, Style } = await import('@capacitor/status-bar')
  const platform = Capacitor.getPlatform()

  try {
    await StatusBar.setStyle({ style: Style.Default })
  } catch {
    // non-fatal
  }

  try {
    // Prefer non-overlay WebView so content starts below the status bar.
    // On some Android 14/15 builds edge-to-edge still bleeds; CSS safe-area +
    // --native-status-bar-inset below cover those devices.
    await StatusBar.setOverlaysWebView({ overlay: false })
  } catch {
    // non-fatal
  }

  try {
    // Match light marketing header; dark mode is handled by WebView theme.
    await StatusBar.setBackgroundColor({ color: '#ffffff' })
  } catch {
    // iOS / unsupported — ignore
  }

  // Fallback inset when WebView does not report env(safe-area-inset-top)
  // (common on Android Capacitor even with notches / punch-holes).
  if (platform === 'android') {
    const approxStatusBar =
      typeof window !== 'undefined' && window.screen?.width
        ? Math.max(24, Math.round((window.devicePixelRatio || 1) * 24) / (window.devicePixelRatio || 1))
        : 28
    // Only apply a gap if CSS env() is effectively zero (WebView ignored insets).
    try {
      const probe = document.createElement('div')
      probe.style.paddingTop = 'env(safe-area-inset-top, 0px)'
      probe.style.position = 'fixed'
      probe.style.visibility = 'hidden'
      document.body.appendChild(probe)
      const reported = parseFloat(getComputedStyle(probe).paddingTop || '0') || 0
      document.body.removeChild(probe)
      if (reported < 1) {
        document.documentElement.style.setProperty(
          '--native-status-bar-inset',
          `${approxStatusBar}px`,
        )
      } else {
        document.documentElement.style.setProperty('--native-status-bar-inset', '0px')
      }
    } catch {
      document.documentElement.style.setProperty('--native-status-bar-inset', `${approxStatusBar}px`)
    }
  }
}

export async function initCapacitorShell(): Promise<void> {
  if (!isCapacitorNative()) return

  const [{ SplashScreen }, { App }] = await Promise.all([
    import('@capacitor/splash-screen'),
    import('@capacitor/app'),
  ])

  try {
    await SplashScreen.hide()
  } catch {
    // non-fatal
  }

  await configureNativeChrome()

  document.documentElement.classList.add('native-app')
  document.documentElement.dataset.nativePlatform = Capacitor.getPlatform()

  // Re-apply after resume (some OEMs reset edge-to-edge on activity restart).
  void App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) void configureNativeChrome()
  })

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

export async function closeInAppBrowser(): Promise<void> {
  if (!isCapacitorNative()) return

  try {
    const { Browser } = await import('@capacitor/browser')
    await Browser.close()
  } catch {
    // Browser may already be closed after the deep link fires
  }
}

/**
 * Google OAuth in embedded WebViews is blocked by Google.
 * Native shell opens the system browser, completes OAuth there, then hands off
 * the session via /auth/mobile-handoff → deep link → mobile-handoff credentials.
 */
export async function signInWithGoogle(callbackPath: string): Promise<void> {
  if (isCapacitorNative()) {
    const handoffUrl = new URL('/auth/mobile-handoff', window.location.origin)
    handoffUrl.searchParams.set('next', callbackPath)

    const signInUrl = new URL('/api/auth/signin/google', window.location.origin)
    signInUrl.searchParams.set('callbackUrl', handoffUrl.toString())
    await openExternalUrl(signInUrl.toString())
    return
  }

  const { signIn } = await import('next-auth/react')
  await signIn('google', { callbackUrl: callbackPath })
}