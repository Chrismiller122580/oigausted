import { readFileSync } from 'fs';
import path from 'path';

let cachedLogoDataUrl: string | null = null;

/** Inline logo for OG/ImageResponse — avoids flaky self-fetch during SSR image generation. */
export function getMarketingBrandLogoDataUrl(): string {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  const filePath = path.join(process.cwd(), 'public', 'brand', 'oiga-gig-marketing.png');
  const bytes = readFileSync(filePath);
  cachedLogoDataUrl = `data:image/png;base64,${bytes.toString('base64')}`;
  return cachedLogoDataUrl;
}