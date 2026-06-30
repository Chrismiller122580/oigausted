export const MARKETING_BRAND_LOGO_PATH = '/brand/oiga-gig-marketing.png';
export const BRAND_PLATFORM_URL = 'oigagig.com';

export function buildBrandFooter(storeUrl: string): string {
  return `\n\n🏪 Mi tienda: ${storeUrl}\n— Servicios en ${BRAND_PLATFORM_URL} 🇨🇴`;
}

export function applyTextBranding(text: string, storeUrl: string): string {
  let result = (text || '').trim();
  const platformHost = BRAND_PLATFORM_URL;
  const storeHost = storeUrl.replace(/^https?:\/\//, '');

  if (!result.toLowerCase().includes(platformHost)) {
    result += `\n\n👉 ${platformHost}`;
  }
  if (!result.includes(storeHost) && !result.includes(storeUrl)) {
    result += `\n🏪 ${storeUrl}`;
  }
  if (!result.includes('Mi tienda')) {
    result += buildBrandFooter(storeUrl);
  }
  return result;
}

export function applySocialBranding(
  social: { instagram: string; whatsapp: string },
  storeUrl: string,
): { instagram: string; whatsapp: string } {
  return {
    instagram: applyTextBranding(social.instagram, storeUrl),
    whatsapp: applyTextBranding(social.whatsapp, storeUrl),
  };
}