import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { BRAND_PLATFORM_URL } from '@/lib/seller-marketing-brand';

let cachedLogoDataUrl: string | null | undefined;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

/** Best-effort logo data URL for optional SVG embedding. */
export function tryGetMarketingBrandLogoDataUrl(): string | null {
  if (cachedLogoDataUrl !== undefined) return cachedLogoDataUrl;

  const candidates = [
    path.join(process.cwd(), 'public', 'brand', 'oiga-gig-marketing.png'),
    path.join(process.cwd(), '.next', 'standalone', 'public', 'brand', 'oiga-gig-marketing.png'),
  ];

  const MAX_LOGO_BYTES = 150_000;

  for (const filePath of candidates) {
    try {
      if (!existsSync(filePath)) continue;
      const bytes = readFileSync(filePath);
      if (bytes.length === 0 || bytes.length > MAX_LOGO_BYTES) continue;
      cachedLogoDataUrl = `data:image/png;base64,${bytes.toString('base64')}`;
      return cachedLogoDataUrl;
    } catch {
      // try next candidate
    }
  }

  cachedLogoDataUrl = null;
  return null;
}

export type BrandCardInput = {
  format: 'feed' | 'story';
  businessName: string;
  headline: string;
  storeDisplay: string;
};

/** SVG brand card — reliable on Vercel serverless (no Satori / ImageResponse). */
export function generateMarketingBrandCardSvg(input: BrandCardInput): string {
  const width = 1080;
  const height = input.format === 'story' ? 1920 : 1080;
  const businessName = escapeXml(input.businessName);
  const headlineLines = wrapText(escapeXml(input.headline), input.format === 'story' ? 28 : 32);
  const storeDisplay = escapeXml(input.storeDisplay);
  const platform = escapeXml(BRAND_PLATFORM_URL);
  const logoDataUrl = tryGetMarketingBrandLogoDataUrl();

  const titleSize = input.format === 'story' ? 52 : 44;
  const subtitleSize = input.format === 'story' ? 34 : 28;
  const headlineStartY = input.format === 'story' ? 720 : 520;
  const logoY = input.format === 'story' ? 120 : 80;
  const logoBlock = logoDataUrl
    ? `<image href="${logoDataUrl}" x="${(width - 320) / 2}" y="${logoY}" width="320" height="140" preserveAspectRatio="xMidYMid meet" />`
    : `<text x="${width / 2}" y="${logoY + 90}" text-anchor="middle" fill="white" font-size="56" font-weight="800" font-family="system-ui, sans-serif">Oiga Gig</text>`;

  const headlineSvg = headlineLines
    .map(
      (line, i) =>
        `<text x="${width / 2}" y="${headlineStartY + i * (subtitleSize + 12)}" text-anchor="middle" fill="white" font-size="${subtitleSize}" font-weight="600" font-family="system-ui, sans-serif" opacity="0.95">${line}</text>`,
    )
    .join('\n');

  const footerY = height - (input.format === 'story' ? 280 : 220);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ea580c"/>
      <stop offset="55%" stop-color="#dc2626"/>
      <stop offset="100%" stop-color="#be123c"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  ${logoBlock}
  <text x="${width / 2}" y="${input.format === 'story' ? 360 : 300}" text-anchor="middle" fill="white" font-size="${titleSize}" font-weight="800" font-family="system-ui, sans-serif">${businessName}</text>
  ${headlineSvg}
  <rect x="56" y="${footerY}" width="${width - 112}" height="88" rx="16" fill="rgba(0,0,0,0.25)"/>
  <text x="80" y="${footerY + 56}" fill="white" font-size="28" font-weight="700" font-family="system-ui, sans-serif">${platform}</text>
  <rect x="56" y="${footerY + 108}" width="${width - 240}" height="88" rx="16" fill="rgba(255,255,255,0.15)"/>
  <text x="80" y="${footerY + 158}" fill="white" font-size="22" font-weight="600" font-family="system-ui, sans-serif">Mi tienda: ${storeDisplay}</text>
  <rect x="${width - 236}" y="${footerY + 108}" width="180" height="180" rx="12" fill="white"/>
  <text x="${width - 146}" y="${footerY + 170}" text-anchor="middle" fill="#111827" font-size="13" font-weight="700" font-family="system-ui, sans-serif">Escanea o visita</text>
  <text x="${width - 146}" y="${footerY + 220}" text-anchor="middle" fill="#ea580c" font-size="11" font-weight="600" font-family="system-ui, sans-serif">${storeDisplay.length > 34 ? storeDisplay.slice(0, 31) + '...' : storeDisplay}</text>
</svg>`;
}