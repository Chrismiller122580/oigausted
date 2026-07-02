#!/usr/bin/env node
/**
 * Export OigaGIG PNG logos from the illustrated reference artwork.
 * Place oigagig-reference.jpg in public/brand/ (the approved megaphone logo).
 *
 * Run: npm run logos:export
 */
import sharp from 'sharp';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const brandDir = path.join(root, 'public', 'brand');
const referencePath = path.join(brandDir, 'oigagig-reference.jpg');

if (!existsSync(referencePath)) {
  console.error(`Missing reference: ${referencePath}`);
  process.exit(1);
}

const meta = await sharp(referencePath).metadata();
const scale = meta.width / 683;

await sharp(referencePath)
  .resize({ width: 832, height: 1248, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(path.join(brandDir, 'oiga-gig-marketing.png'));
console.log(`Wrote ${path.join(brandDir, 'oiga-gig-marketing.png')}`);

const cropTop = Math.round(248 * scale);
const cropHeight = Math.round(390 * scale);

await sharp(referencePath)
  .extract({
    left: 0,
    top: cropTop,
    width: meta.width,
    height: Math.min(cropHeight, meta.height - cropTop),
  })
  .resize({ width: 832, height: 414, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(path.join(brandDir, 'oiga-gig-wordmark.png'));
console.log(`Wrote ${path.join(brandDir, 'oiga-gig-wordmark.png')}`);

// Back-compat alias for old /logo.png references
await sharp(path.join(brandDir, 'oiga-gig-wordmark.png'))
  .png()
  .toFile(path.join(root, 'public', 'logo.png'));
console.log(`Wrote ${path.join(root, 'public', 'logo.png')} (legacy alias)`);