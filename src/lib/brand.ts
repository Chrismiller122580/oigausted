export const BRAND_NAME = 'OigaGIG' as const
export const BRAND_HASHTAG = '#OigaGIG' as const

/** Fix common admin typos / legacy names in public UI */
export function normalizeSiteName(name: string | null | undefined): string {
  const trimmed = (name || '').trim()
  if (!trimmed) return BRAND_NAME
  if (/^hey\s*gig$/i.test(trimmed)) return BRAND_NAME
  return trimmed
}
/** Square app mark (OU) — nav, PWA, default site logo for now */
export const BRAND_APP_ICON_PATH = '/icon.png' as const
export const BRAND_NAV_LOGO_PATH = BRAND_APP_ICON_PATH
/** Full megaphone wordmark + tagline — optional hero / OG */
export const BRAND_MARKETING_LOGO_PATH = '/brand/oiga-gig-marketing.png' as const
export const BRAND_LOGO_PATH = BRAND_APP_ICON_PATH

export function isSquareBrandLogo(url: string): boolean {
  return url.endsWith('/icon.png') || url.endsWith('/apple-icon.png')
}