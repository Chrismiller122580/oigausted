#!/usr/bin/env node
/**
 * Generates Android mipmap launcher icons and iOS App Store icon from public/icon.png.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = join(root, '..')
const sourceIcon = join(repoRoot, 'public', 'icon.png')

if (!existsSync(sourceIcon)) {
  console.warn('[mobile/icons] skip — missing public/icon.png')
  process.exit(0)
}

const androidSizes = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
]

const androidResRoot = join(root, 'android', 'app', 'src', 'main', 'res')

for (const { dir, size } of androidSizes) {
  const outDir = join(androidResRoot, dir)
  mkdirSync(outDir, { recursive: true })
  const png = await sharp(sourceIcon).resize(size, size, { fit: 'cover' }).png().toBuffer()
  for (const name of ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']) {
    await sharp(png).toFile(join(outDir, name))
  }
}

const iosIcon = join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png')
mkdirSync(dirname(iosIcon), { recursive: true })
await sharp(sourceIcon).resize(1024, 1024, { fit: 'cover' }).png().toFile(iosIcon)

const wwwIcon = join(root, 'www', 'icon.png')
mkdirSync(dirname(wwwIcon), { recursive: true })
copyFileSync(sourceIcon, wwwIcon)

console.log('[mobile/icons] regenerated launcher icons from public/icon.png')