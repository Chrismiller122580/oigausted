#!/usr/bin/env node
/**
 * Copies shared brand assets from the Next.js app into the Capacitor www bundle.
 * Run automatically on mobile/postinstall.
 */
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = join(root, '..')
const wwwDir = join(root, 'www')
const resourcesDir = join(root, 'resources')

const copies = [
  { from: join(repoRoot, 'public', 'icon.png'), to: join(wwwDir, 'icon.png') },
  { from: join(repoRoot, 'public', 'icon.png'), to: join(resourcesDir, 'icon.png') },
  { from: join(repoRoot, 'public', 'apple-icon.png'), to: join(resourcesDir, 'icon-only.png') },
]

mkdirSync(wwwDir, { recursive: true })
mkdirSync(resourcesDir, { recursive: true })

let copied = 0
for (const { from, to } of copies) {
  if (!existsSync(from)) {
    console.warn(`[mobile/assets] skip missing: ${from}`)
    continue
  }
  mkdirSync(dirname(to), { recursive: true })
  copyFileSync(from, to)
  copied += 1
}

console.log(`[mobile/assets] synced ${copied} asset(s)`)

try {
  const iconScript = join(root, 'scripts', 'generate-app-icons.mjs')
  if (existsSync(iconScript)) {
    const result = spawnSync(process.execPath, [iconScript], { stdio: 'inherit' })
    if (result.status !== 0) {
      console.warn('[mobile/assets] icon generation exited with non-zero status')
    }
  }
} catch (err) {
  console.warn('[mobile/assets] icon generation skipped:', err instanceof Error ? err.message : err)
}