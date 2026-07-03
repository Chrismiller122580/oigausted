#!/usr/bin/env node
/**
 * Static verification for the Capacitor scaffold (no emulator required).
 * Run: npm run verify --prefix mobile
 */
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []

function assert(condition, message) {
  if (!condition) errors.push(message)
}

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

const requiredPaths = [
  'capacitor.config.ts',
  'package.json',
  'www/index.html',
  'android/app/src/main/AndroidManifest.xml',
  'ios/App/App/Info.plist',
  'scripts/configure-native.mjs',
  'scripts/sync-assets.mjs',
]

for (const rel of requiredPaths) {
  assert(existsSync(join(root, rel)), `missing: ${rel}`)
}

const config = read('capacitor.config.ts')
assert(config.includes('com.oigagig.app'), 'capacitor.config.ts missing appId')
assert(config.includes('https://oigagig.com'), 'capacitor.config.ts missing production URL')
assert(config.includes('checkout.wompi.co'), 'capacitor.config.ts missing Wompi allowNavigation')

const manifest = read('android/app/src/main/AndroidManifest.xml')
assert(manifest.includes('android:scheme="oigagig"'), 'Android deep link scheme missing')
assert(manifest.includes('android.permission.INTERNET'), 'Android INTERNET permission missing')

const plist = read('ios/App/App/Info.plist')
assert(plist.includes('<string>oigagig</string>'), 'iOS URL scheme missing')
assert(plist.includes('<string>OigaGIG</string>'), 'iOS display name should be OigaGIG')
assert(plist.includes('<string>arm64</string>'), 'iOS should require arm64 (not legacy armv7)')

const pbxproj = read('ios/App/App.xcodeproj/project.pbxproj')
assert(pbxproj.includes('PRODUCT_BUNDLE_IDENTIFIER = com.oigagig.app'), 'iOS bundle ID missing')
assert(pbxproj.includes('IPHONEOS_DEPLOYMENT_TARGET = 15.0'), 'iOS deployment target missing')
assert(pbxproj.includes('MARKETING_VERSION = 1.0'), 'iOS marketing version missing')

const iosCapConfigPath = join(root, 'ios', 'App', 'App', 'capacitor.config.json')
if (existsSync(iosCapConfigPath)) {
  const iosCapConfig = readFileSync(iosCapConfigPath, 'utf8')
  assert(iosCapConfig.includes('https://oigagig.com'), 'iOS capacitor.config.json missing production URL')
} else {
  assert(config.includes('https://oigagig.com'), 'capacitor.config.ts missing production URL (run npm run mobile:sync)')
}

const appIcon = join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png')
assert(existsSync(appIcon), 'missing iOS App Store icon (1024x1024)')

const bridgePath = join(root, '..', 'src', 'lib', 'capacitor-native.ts')
assert(existsSync(bridgePath), 'missing web bridge: src/lib/capacitor-native.ts')
const bridge = readFileSync(bridgePath, 'utf8')
assert(bridge.includes('signInWithGoogle'), 'capacitor-native.ts missing signInWithGoogle')
assert(bridge.includes('initCapacitorShell'), 'capacitor-native.ts missing initCapacitorShell')
assert(bridge.includes('closeInAppBrowser'), 'capacitor-native.ts missing closeInAppBrowser')

const handoffPage = join(root, '..', 'src', 'app', 'auth', 'mobile-handoff', 'page.tsx')
assert(existsSync(handoffPage), 'missing web handoff page: src/app/auth/mobile-handoff/page.tsx')

const tokenLib = join(root, '..', 'src', 'lib', 'mobile-auth-token.ts')
assert(existsSync(tokenLib), 'missing token lib: src/lib/mobile-auth-token.ts')

if (errors.length) {
  console.error('❌ mobile scaffold verification failed:\n')
  for (const err of errors) console.error(`  - ${err}`)
  process.exit(1)
}

console.log('✅ mobile scaffold verification passed')
console.log('   Next: npm run mobile:open:android (Java 17+) or mobile:open:ios (macOS)')