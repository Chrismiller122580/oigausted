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

### 4. Admin home-screen widget (Android)

Admins can add the **OigaGIG Admin Stats** widget to their Android home screen.

**To populate the widget:**
1. Install the app and sign in as **admin**
2. Open any **/admin** page (e.g. tap the widget → opens `/admin`)
3. Wait a few seconds — stats sync in the background (no extra UI)
4. Return to the home screen; the widget should show live numbers

If the widget shows dashes (`—`), open the app, go to `/admin`, and bring the app to the foreground once.

### 5. Push notifications (native FCM + web push)

The mobile app auto-registers for push when a user signs in (Android + iOS via `@capacitor/push-notifications`). Notifications use the same backend as web push.

**Firebase setup (required for native push on device):**

1. Create a [Firebase project](https://console.firebase.google.com/) and add an Android app with package `com.oigagig.app`
2. Download `google-services.json` → save as `mobile/android/app/google-services.json` (see `google-services.json.example`)
3. In Firebase → Project Settings → Service accounts → **Generate new private key**
4. Add to **Vercel** env vars:
   - `FIREBASE_SERVICE_ACCOUNT_JSON` = full JSON string (one line)
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` (for browser web push)
5. Rebuild the app: `npm run mobile:sync` then `npm run mobile:build:android`

On first launch after install, accept the notification permission prompt while signed in.

### 6. Store assets

- App icons: `mobile/resources/` (synced from `public/icon.png` via `npm run mobile:assets`)
- Screenshots, Spanish metadata, privacy policy URL: `https://oigagig.com/privacy`
- Set `NEXT_PUBLIC_APP_STORE_URL` and `NEXT_PUBLIC_PLAY_STORE_URL` in Vercel after approval

### 7. Signing

- **Android:** Upload keystore + Play App Signing (see [Google Play release](#google-play-release) below)
- **iOS:** Distribution cert + App Store Connect record for `com.oigagig.app`

## Google Play release

The Play Store requires a **signed Android App Bundle (`.aab`)**, not an APK. Package name: **`com.oigagig.app`**.

### Step 1 — Play Console account

1. Go to [Google Play Console](https://play.google.com/console) and pay the **$25** one-time developer fee (if not already done).
2. **Create app** → name **OigaGIG** → default language **Spanish (Colombia)** → type **App** → free.

### Step 2 — Upload keystore (one time)

From the repo root:

```bash
npm run mobile:keystore
```

This creates `mobile/android/keystore/oigagig-upload.jks` and copies `keystore.properties.example` → `keystore.properties`.

Edit `mobile/android/keystore.properties` and set `storePassword` and `keyPassword`.

**Back up the `.jks` file and passwords offline.** Google cannot recover a lost upload key.

### Step 3 — Build the release bundle

```bash
npm run mobile:build:android
```

Output: `mobile/android/app/build/outputs/bundle/release/app-release.aab`

Bump `versionCode` / `versionName` in `mobile/android/app/build.gradle` before each store upload.

### Step 4 — Play Console setup (first release)

Complete these sections in Play Console before production:

| Section | What to enter |
|---------|----------------|
| **App access** | “All functionality available without restrictions” (or explain test accounts if you add login gates later) |
| **Ads** | No (unless you add ads) |
| **Content rating** | Run the questionnaire (marketplace / user-generated content may apply) |
| **Target audience** | 18+ recommended for a gig marketplace |
| **News app** | No |
| **COVID-19** | No |
| **Data safety** | Account info, location (if used), payments — align with [privacy policy](https://oigagig.com/privacy) |
| **Store listing** | See [listing copy](#store-listing-copy) below |
| **App integrity** | Enable **Play App Signing** when prompted (Google holds the app signing key) |

### Step 5 — Upload & roll out

1. **Testing → Internal testing** → Create release → upload `app-release.aab`.
2. Add yourself as a tester (email list) and install from the opt-in link on your phone.
3. After QA, promote to **Production** (or closed/open testing first).

### Step 6 — Wire the website badge

When the listing is live, set in **Vercel → Environment Variables**:

```
NEXT_PUBLIC_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=com.oigagig.app
```

Redeploy. The footer **Google Play** badge in `AppStoreBadges.tsx` will link to the store.

### Store listing copy

Suggested Spanish metadata (adjust to your brand voice):

| Field | Text |
|-------|------|
| **Short description** (80 chars) | Encuentra y ofrece servicios locales en Colombia con OigaGIG. |
| **Full description** | OigaGIG conecta personas que necesitan un servicio con profesionales cercanos. Publica gigs, recibe ofertas, paga con seguridad y gestiona pedidos desde tu celular. Ideal para compradores y vendedores en Colombia. |
| **Category** | Business or Lifestyle |
| **Privacy policy** | `https://oigagig.com/privacy` |
| **Contact email** | Your support email |

**Graphics:** 512×512 icon (from `mobile/resources/` / synced mipmap), feature graphic 1024×500, phone screenshots (1080×1920 or similar) from a real device.

### Android SDK in Codespaces / CI

- **JDK 21** required (`openjdk-21-jdk`). Java 25 breaks Gradle; Java 17 is too old for Capacitor 8.
- If `local.properties` is missing, the build script writes `sdk.dir` from `ANDROID_HOME` or `~/android-sdk`.

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

## iOS check (requires macOS)

Cannot build or run the iOS target from Linux/Codespaces. On a Mac:

```bash
npm run mobile:install
npm run mobile:sync
npm run mobile:open:ios   # opens Xcode
```

In Xcode (project `mobile/ios/App/App.xcodeproj`):

1. Select the **App** target → **Signing & Capabilities** → set your **Team** (Apple Developer account)
2. Confirm **Bundle Identifier**: `com.oigagig.app`
3. **Product → Run** on simulator or device (loads `https://oigagig.com`)
4. For TestFlight: **Product → Archive** → Distribute to App Store Connect

### iOS remote debugging (Safari Web Inspector)

1. On iPhone: Settings → Safari → Advanced → **Web Inspector** ON
2. Connect device to Mac via USB
3. Safari → Develop → [your device] → **OigaGIG**
4. Inspect console, network, and layout (same web app as Android)

### iOS scaffold status (automated)

```bash
npm run mobile:verify
```

Checks: URL scheme `oigagig://`, bundle ID, deployment target iOS 15+, 1024×1024 app icon, production server URL.

| Item | Current value |
|------|----------------|
| Bundle ID | `com.oigagig.app` |
| Min iOS | 15.0 |
| Version | 1.3 (build 4) |
| Deep link | `oigagig://app/...` |
| WebView URL | `https://oigagig.com` |
| Signing team | Not set in repo (configure in Xcode) |

## Scripts (repo root)

| Script | Action |
|--------|--------|
| `npm run mobile:install` | Install mobile dependencies |
| `npm run mobile:sync` | `cap sync` + native deep-link patches |
| `npm run mobile:assets` | Copy icons from `public/` |
| `npm run mobile:open:android` | Open Android Studio |
| `npm run mobile:open:ios` | Open Xcode |
| `npm run mobile:keystore` | Create Play upload keystore (once) |
| `npm run mobile:build:android` | Signed `.aab` for Google Play |

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