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

/** Turn near-white JPEG backdrop into true PNG transparency (keeps soft edges). */
async function stripWhiteBackground(pipeline, { threshold = 248, feather = 18 } = {}) {
  const { data, info } = await pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = data;
  const softStart = threshold - feather;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);

    // Ignore saturated brand colors (yellow/blue/red megaphone)
    if (max - min > 28) continue;

    if (min >= threshold) {
      pixels[i + 3] = 0;
      continue;
    }

    if (min >= softStart) {
      const t = (min - softStart) / (threshold - softStart);
      pixels[i + 3] = Math.round(pixels[i + 3] * (1 - t));
    }
  }

  return sharp(Buffer.from(pixels), {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png();
}

const meta = await sharp(referencePath).metadata();
const scale = meta.width / 683;

const marketing = await stripWhiteBackground(
  sharp(referencePath).resize({
    width: 832,
    height: 1248,
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  }),
);
await marketing.toFile(path.join(brandDir, 'oiga-gig-marketing.png'));
console.log(`Wrote ${path.join(brandDir, 'oiga-gig-marketing.png')}`);

const cropTop = Math.round(248 * scale);
const cropHeight = Math.round(390 * scale);

const wordmark = await stripWhiteBackground(
  sharp(referencePath)
    .extract({
      left: 0,
      top: cropTop,
      width: meta.width,
      height: Math.min(cropHeight, meta.height - cropTop),
    })
    .resize({
      width: 832,
      height: 414,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    }),
);
await wordmark.toFile(path.join(brandDir, 'oiga-gig-wordmark.png'));
console.log(`Wrote ${path.join(brandDir, 'oiga-gig-wordmark.png')}`);

// Back-compat alias for old /logo.png references
await sharp(path.join(brandDir, 'oiga-gig-wordmark.png'))
  .png()
  .toFile(path.join(root, 'public', 'logo.png'));
console.log(`Wrote ${path.join(root, 'public', 'logo.png')} (legacy alias)`);