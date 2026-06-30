export const MARKETING_BRAND_LOGO_PATH = '/brand/oiga-gig-marketing.png';
export const BRAND_PLATFORM_URL = 'oigagig.com';

const UUID_SELLER_PATH =
  /https?:\/\/[^/\s]+\/sellers\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

export function buildBrandFooter(storeUrl: string): string {
  return `\n\n🏪 Mi tienda: ${storeUrl}\n— Servicios en ${BRAND_PLATFORM_URL} 🇨🇴`;
}

/** Replace legacy UUID seller links with the canonical slug URL. */
export function normalizeStoreUrlsInText(text: string, storeUrl: string): string {
  return (text || '').replace(UUID_SELLER_PATH, storeUrl);
}

export function applyTextBranding(text: string, storeUrl: string): string {
  let result = normalizeStoreUrlsInText((text || '').trim(), storeUrl);
  const platformHost = BRAND_PLATFORM_URL;
  const storeHost = storeUrl.replace(/^https?:\/\//, '');
  const hasStoreLink = result.includes(storeHost) || result.includes(storeUrl);

  if (!result.toLowerCase().includes(platformHost)) {
    result += `\n\n👉 ${platformHost}`;
  }

  if (!hasStoreLink) {
    result += buildBrandFooter(storeUrl);
  } else if (!result.includes('Mi tienda') && !result.includes('— Servicios en')) {
    result += `\n— Servicios en ${BRAND_PLATFORM_URL} 🇨🇴`;
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