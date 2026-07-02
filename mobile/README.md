# OigaGIG Mobile Shell (Capacitor)

Native iOS and Android wrappers that load the production web app at `https://oigagig.com`. The Next.js codebase stays the single source of truth; this folder only contains the native shell, assets, and release tooling.

## Architecture

```
mobile/ (Capacitor)
  └── WebView → https://oigagig.com (Next.js on Vercel)
        └── src/lib/capacitor-native.ts (bridge, deep links, OAuth hook)
```

Deep-link scheme: `oigagig://app/...` (e.g. `oigagig://app/orders`).

## Prerequisites

- Node.js 20+
- **Android:** Android Studio + SDK 34+
- **iOS:** macOS + Xcode 16+ (build/sign on Mac only)
- Apple Developer account ($99/yr) and Google Play Console ($25 one-time) — **at release**

## Quick start (scaffold QA)

```bash
# From repo root
npm run mobile:install
npm run mobile:sync

# Android emulator or device
npm run mobile:open:android

# iOS (macOS only)
npm run mobile:open:ios
```

## Environment

Copy `mobile/.env.example` to `mobile/.env.local` when needed:

| Variable | Purpose |
|----------|---------|
| `CAPACITOR_SERVER_URL` | WebView entry URL (default `https://oigagig.com`) |
| `CAPACITOR_DEBUG` | Enable WebView debugging in native IDEs |

Load env before sync:

```bash
export CAPACITOR_SERVER_URL=http://YOUR_LAN_IP:3000
npm run mobile:sync
```

## Release checklist (keys & connections — do at end)

### 1. Google OAuth

- Add authorized redirect URI: `https://oigagig.com/api/auth/callback/google`
- Custom scheme handler is patched by `scripts/configure-native.mjs` (`oigagig://app/...`)
- Session handoff flow (implemented):
  1. WebView opens system browser → Google OAuth
  2. Browser lands on `/auth/mobile-handoff` (has session cookie)
  3. Handoff issues a 90s one-time token → deep link `oigagig://app/auth/mobile-callback?token=…`
  4. WebView exchanges token via NextAuth `mobile-handoff` credentials provider

### 2. Google Maps

- Add iOS bundle ID / Android package name restrictions if using native API keys
- HTTP referrer rules already cover `oigagig.com`

### 3. Wompi payments

- E2E test checkout inside the shell on real devices
- Confirm `checkout.wompi.co` is in `allowNavigation` (already configured)

### 4. Push notifications (optional v2)

- Web Push works in shell when installed; native APNs/FCM is a follow-up

### 5. Store assets

- App icons: `mobile/resources/` (synced from `public/icon.png` via `npm run mobile:assets`)
- Screenshots, Spanish metadata, privacy policy URL: `https://oigagig.com/privacy`
- Set `NEXT_PUBLIC_APP_STORE_URL` and `NEXT_PUBLIC_PLAY_STORE_URL` in Vercel after approval

### 6. Signing

- **Android:** Upload keystore + Play App Signing
- **iOS:** Distribution cert + App Store Connect record for `com.oigagig.app`

## Debugging on Android (logs & WebView inspect)

There is no separate mobile log file in the repo — the shell loads the live web app, so most issues are **WebView + JavaScript** and are debugged remotely.

### 1. Enable WebView remote debugging

```bash
export CAPACITOR_DEBUG=true
npm run mobile:sync
```

Rebuild/reinstall the APK, then on a computer with Chrome:

1. Connect the phone via USB (USB debugging on)
2. Open `chrome://inspect/#devices`
3. Find **OigaGIG** / `com.oigagig.app` → **inspect**
4. Use **Console**, **Network**, and **Elements** like desktop DevTools

This shows `console.log`, failed fetches, layout/CSS issues, and notification toasts.

### 2. Android native logs (`adb logcat`)

```bash
adb logcat | grep -iE "chromium|Capacitor|Console|oigagig"
```

Useful for WebView crashes, SSL errors, and Capacitor plugin failures. Filter further with `Capacitor` or your package name.

### 3. Server / API logs

Mobile uses production APIs on `oigagig.com`. Check **Vercel → Project → Logs** for `/api/notifications`, `/api/auth`, etc. These are not on the device.

### 4. Common Android layout symptoms

| Symptom | Typical cause |
|---------|----------------|
| Bottom nav covers content | Missing `mobile-page-bottom` padding (nav height + gesture inset) |
| Toasts off-screen | Sonner position + safe-area; fixed in `AppToaster` + `globals.css` |
| Notification dropdown clipped | Bell dropdown now uses fixed panel on mobile |
| Top content under status bar | `viewportFit: cover` + `StatusBar.setOverlaysWebView(false)` |

After layout fixes, force-close the app (or clear WebView cache) so the latest JS/CSS loads from production.

## Scripts (repo root)

| Script | Action |
|--------|--------|
| `npm run mobile:install` | Install mobile dependencies |
| `npm run mobile:sync` | `cap sync` + native deep-link patches |
| `npm run mobile:assets` | Copy icons from `public/` |
| `npm run mobile:open:android` | Open Android Studio |
| `npm run mobile:open:ios` | Open Xcode |

## Project layout

```
mobile/
  capacitor.config.ts   # Remote server + plugin defaults
  www/                  # Fallback bundle + synced icons
  resources/            # Native icon source
  scripts/
    sync-assets.mjs
    configure-native.mjs
  android/              # Generated by Capacitor CLI
  ios/                  # Generated by Capacitor CLI
```