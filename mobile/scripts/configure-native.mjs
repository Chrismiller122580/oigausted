#!/usr/bin/env node
/**
 * Applies OigaGig-specific native overrides after `cap sync`.
 * Idempotent — safe to run multiple times.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const APP_SCHEME = 'oigagig'
const APP_HOST = 'app'

function patchAndroidManifest() {
  const manifestPath = join(
    root,
    'android',
    'app',
    'src',
    'main',
    'AndroidManifest.xml',
  )
  if (!existsSync(manifestPath)) return

  let xml = readFileSync(manifestPath, 'utf8')
  const intentBlock = `
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="${APP_SCHEME}" android:host="${APP_HOST}" />
            </intent-filter>`

  if (!xml.includes(`android:scheme="${APP_SCHEME}"`)) {
    xml = xml.replace(
      '</activity>',
      `${intentBlock}\n        </activity>`,
    )
    writeFileSync(manifestPath, xml)
    console.log('[mobile/native] patched Android deep-link intent filter')
  }
}

function patchIosInfoPlist() {
  const plistPath = join(root, 'ios', 'App', 'App', 'Info.plist')
  if (!existsSync(plistPath)) return

  let plist = readFileSync(plistPath, 'utf8')
  const urlTypes = `
	<key>CFBundleURLTypes</key>
	<array>
		<dict>
			<key>CFBundleURLName</key>
			<string>com.oigagig.app</string>
			<key>CFBundleURLSchemes</key>
			<array>
				<string>${APP_SCHEME}</string>
			</array>
		</dict>
	</array>`

  if (!plist.includes('<key>CFBundleURLTypes</key>')) {
    plist = plist.replace('</dict>\n</plist>', `${urlTypes}\n</dict>\n</plist>`)
    writeFileSync(plistPath, plist)
    console.log('[mobile/native] patched iOS URL scheme')
  }
}

patchAndroidManifest()
patchIosInfoPlist()