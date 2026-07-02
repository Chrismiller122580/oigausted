export const BRAND_NAME = 'OigaGIG' as const
export const BRAND_HASHTAG = '#OigaGIG' as const

/** Fix common admin typos / legacy names in public UI */
export function normalizeSiteName(name: string | null | undefined): string {
  const trimmed = (name || '').trim()
  if (!trimmed) return BRAND_NAME
  if (/^hey\s*gig$/i.test(trimmed)) return BRAND_NAME
  return trimmed
}
/** Horizontal wordmark — nav bars, compact UI */
export const BRAND_NAV_LOGO_PATH = '/logo.png' as const
/** Full logo with tagline — hero, OG, marketing */
export const BRAND_MARKETING_LOGO_PATH = '/brand/oiga-gig-marketing.png' as const
export const BRAND_LOGO_PATH = BRAND_MARKETING_LOGO_PATH