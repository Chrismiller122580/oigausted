# Google Play Console — OigaGIG first release

Use this with the **Cortland Blackstone** Play developer account.

| Field | Value |
|-------|--------|
| **Developer account ID** | `5733205736639632869` |
| **Developer name** | Cortland Blackstone |
| **Account owner** | cortlandblackstone@gmail.com |
| **App name** | OigaGIG |
| **Package name** | `com.oigagig.app` (cannot change after create) |
| **Default language** | Spanish (Colombia) — `es-419` / Spanish |
| **App type** | App |
| **Free / paid** | Free |
| **Website** | https://oigagig.com |
| **Privacy policy** | https://oigagig.com/privacy |
| **Support email** | cortlandblackstone@gmail.com (or your preferred support inbox) |
| **Contact website** | http://www.cortlandblackstone.com |

Developer legal identity is already on the Play account profile (owner settings). Use that same profile for any additional account verification Google requests — do not put home address into the public app listing.

## What is already ready in the repo

| Item | Location |
|------|----------|
| Upload keystore | `mobile/android/keystore/oigagig-upload.jks` |
| Keystore config | `mobile/android/keystore.properties` (gitignored) |
| Signed bundle | `mobile/android/app/build/outputs/bundle/release/app-release.aab` |
| Version | `versionName` **1.5**, `versionCode` **6** (`mobile/android/app/build.gradle`) |
| High-res icon 512×512 | `mobile/store/play/icon-512.png` |
| Feature graphic 1024×500 | `mobile/store/play/feature-graphic-1024x500.png` |
| App icon 1024×1024 | `mobile/store/play/icon-1024.png` |

Rebuild anytime:

```bash
npm run mobile:build:android
```

## Step-by-step in Play Console

Open: [https://play.google.com/console](https://play.google.com/console)  
Sign in as **cortlandblackstone@gmail.com**.

### 1. Create the app (once)

1. **Create app**
2. App name: **OigaGIG**
3. Default language: **Spanish** (prefer Colombia if offered)
4. App or game: **App**
5. Free or paid: **Free**
6. Accept declarations → **Create app**

### 2. Dashboard → set up your app

Complete every required section until the dashboard shows green checkmarks.

#### Store listing

| Field | Suggested copy |
|-------|----------------|
| **App name** | OigaGIG |
| **Short description** (≤80) | Encuentra y ofrece servicios locales en Colombia con OigaGIG. |
| **Full description** | OigaGIG conecta personas que necesitan un servicio con profesionales cercanos. Publica gigs, recibe ofertas, paga con seguridad y gestiona pedidos desde tu celular. Ideal para compradores y vendedores en Colombia. |
| **App icon** | Upload `mobile/store/play/icon-512.png` |
| **Feature graphic** | Upload `mobile/store/play/feature-graphic-1024x500.png` |
| **Phone screenshots** | At least **2** (prefer 4–8). Capture on a real phone or emulator at ~1080×1920: home, gig list, gig detail, login. |
| **Category** | Business (or Lifestyle) |
| **Contact email** | cortlandblackstone@gmail.com |
| **Privacy policy** | `https://oigagig.com/privacy` |
| **Website** (optional) | `https://oigagig.com` |

#### App content / policy questionnaires

| Section | Answer |
|---------|--------|
| **App access** | All functionality available without special access **or** provide a test account if login is required for core review |
| **Ads** | No |
| **Content rating** | Complete questionnaire — marketplace / user-generated content may apply |
| **Target audience** | **18 and over** recommended (gig marketplace + payments) |
| **News app** | No |
| **COVID-19 contact tracing / status** | No |
| **Data safety** | Yes you collect data. Align with privacy policy: account info (email, name), photos (optional profile/gig images), approximate/precise location if maps used, payment-related data via Wompi, app activity. Encryption in transit: Yes. **Account deletion: Yes — in-app** at `/profile` (“Eliminar cuenta”), with optional full personal-data wipe. Also described at https://oigagig.com/privacy |
| **Government apps** | No |
| **Financial features** | Only if you process payments in-app — declare marketplace payments as applicable |
| **Health** | No |

#### App integrity / signing

When uploading the first AAB:

1. Choose **Google Play App Signing** (recommended — keep it on).
2. Upload the **upload key** signed AAB from this repo.
3. Google generates/holds the **app signing key**; you keep the upload keystore offline backup.

**Critical:** back up `mobile/android/keystore/oigagig-upload.jks` and the passwords in `keystore.properties` somewhere safe offline. Lost upload key = painful recovery process.

### 3. First release — Internal testing (recommended)

1. **Testing → Internal testing → Create new release**
2. Upload:  
   `mobile/android/app/build/outputs/bundle/release/app-release.aab`
3. Release name: e.g. `1.4 (5)`
4. Release notes (es):

   ```
   Primera versión de OigaGIG para Android.
   Explora gigs, gestiona pedidos y accede a tu cuenta desde la app.
   ```

5. **Save → Review → Start rollout to Internal testing**
6. **Testers** tab → create email list → add your Gmail(s)
7. Open the **opt-in link** on an Android phone → install from Play Store

### 4. Promote to production

After internal QA looks good:

1. **Production → Create new release** (or promote from internal)
2. Same AAB if still current
3. Complete countries/regions (start with **Colombia** if you want a focused launch)
4. Roll out (staged 20% optional, or 100%)

Review can take hours to a few days for new accounts/apps.

### 5. After the listing is live

Set on **Vercel → Environment Variables → Production**:

```
NEXT_PUBLIC_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=com.oigagig.app
```

Redeploy. Footer Google Play badge then links to the store.

## Digital Asset Links (App Links)

Play Console may show a JSON snippet for **Android App Links**. You do **not** paste that into Play Console.

Host it on the website (already in the repo):

- File: `public/.well-known/assetlinks.json`
- Live URL after deploy: `https://oigagig.com/.well-known/assetlinks.json`

Fingerprints included:

1. **Play App Signing** cert (from Play Console) — installs from Google Play  
2. **Upload keystore** cert — local/sideload signed builds  

After deploy, verify:

```bash
curl -sI https://oigagig.com/.well-known/assetlinks.json
curl -s https://oigagig.com/.well-known/assetlinks.json
```

Google’s tester: https://developers.google.com/digital-asset-links/tools/generator

Note: true HTTPS App Links also need `https` intent-filters with `android:autoVerify="true"` in the Android manifest. Today the shell mainly uses the custom scheme `oigagig://app/...`. Hosting `assetlinks.json` still satisfies Play’s association step.

## Optional (not blocking first upload)

| Item | Why | Status |
|------|-----|--------|
| `google-services.json` for FCM | Native push on Android | Missing — add Firebase Android app `com.oigagig.app` later |
| Screenshots | Required for store listing | Capture on device |
| Bump `versionCode` | Required for every new upload | Currently **5** — bump before second upload |

## Version bumps (next uploads)

Edit `mobile/android/app/build.gradle`:

```gradle
versionCode 6        // always +1
versionName "1.5"    // user-facing
```

Then:

```bash
npm run mobile:build:android
```

## Commands cheat sheet

```bash
# From repo root
npm run mobile:sync                 # sync Capacitor + deep links
npm run mobile:build:android        # signed .aab
# Output:
# mobile/android/app/build/outputs/bundle/release/app-release.aab
```

## Package identity (do not change after create)

- Application ID: `com.oigagig.app`
- Deep link: `oigagig://app/...`
- WebView loads: `https://oigagig.com`
