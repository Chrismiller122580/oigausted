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

function patchAndroidAdminWidget() {
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
  const receiverBlock = `
        <receiver
            android:name=".AdminStatsWidgetProvider"
            android:exported="false"
            android:label="@string/admin_widget_label">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/admin_stats_widget_info" />
        </receiver>`

  if (!xml.includes('AdminStatsWidgetProvider')) {
    xml = xml.replace(
      '</application>',
      `${receiverBlock}\n    </application>`,
    )
    writeFileSync(manifestPath, xml)
    console.log('[mobile/native] patched Android admin stats widget receiver')
  }
}

function patchCapacitorPluginsJson() {
  const pluginsPath = join(root, 'android', 'app', 'src', 'main', 'assets', 'capacitor.plugins.json')
  if (!existsSync(pluginsPath)) return

  let plugins = []
  try {
    plugins = JSON.parse(readFileSync(pluginsPath, 'utf8'))
  } catch {
    return
  }

  const entry = {
    pkg: 'AdminWidget',
    classpath: 'com.oigagig.app.AdminWidgetPlugin',
  }
  const hasEntry = plugins.some((p) => p.classpath === entry.classpath)
  if (!hasEntry) {
    plugins.push(entry)
    writeFileSync(pluginsPath, `${JSON.stringify(plugins, null, '\t')}\n`)
    console.log('[mobile/native] registered AdminWidget in capacitor.plugins.json')
  }
}

patchAndroidManifest()
patchAndroidAdminWidget()
patchCapacitorPluginsJson()
patchIosInfoPlist()