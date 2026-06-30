import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Remote-shell config: the WebView loads production (or CAPACITOR_SERVER_URL for local QA).
 * Keys, OAuth redirect URIs, and store signing are configured at release time — see README.md.
 */
const serverUrl = process.env.CAPACITOR_SERVER_URL ?? 'https://oigagig.com'

const config: CapacitorConfig = {
  appId: 'com.oigagig.app',
  appName: 'OigaGig',
  webDir: 'www',
  server: {
    url: serverUrl,
    cleartext: false,
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'oigagig.com',
    allowNavigation: [
      'oigagig.com',
      '*.oigagig.com',
      '*.vercel.app',
      'checkout.wompi.co',
      '*.wompi.co',
      'accounts.google.com',
      '*.google.com',
      'localhost',
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: '#C2410C',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: '#ffffff',
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: process.env.CAPACITOR_DEBUG === 'true',
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'OigaGig',
    webContentsDebuggingEnabled: process.env.CAPACITOR_DEBUG === 'true',
  },
}

export default config