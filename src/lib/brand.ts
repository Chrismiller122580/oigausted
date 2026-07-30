export const BRAND_NAME = 'OigaGIG' as const
export const BRAND_HASHTAG = '#OigaGIG' as const

/**
 * Public-facing label for admin / CS / staff messages.
 * Never show the individual staff member’s name to users.
 */
export const STAFF_PUBLIC_DISPLAY_NAME = BRAND_NAME
/** Slightly warmer variant for user support UI */
export const STAFF_TEAM_DISPLAY_NAME = `Equipo ${BRAND_NAME}` as const

/**
 * Display label for staff-authored support messages.
 * - Public replies → always OigaGIG (or Equipo OigaGIG)
 * - Internal notes → may include author for ops accountability only
 */
export function staffMessageDisplayName(opts?: {
  internal?: boolean
  /** Prefer email for internal audit display */
  authorName?: string | null
  authorEmail?: string | null
  /** 'public' = brand only; 'team' = "Equipo OigaGIG" */
  style?: 'public' | 'team'
}): string {
  if (opts?.internal) {
    const who = opts.authorName?.trim() || opts.authorEmail?.trim()
    return who ? `Nota interna · ${who}` : 'Nota interna'
  }
  return opts?.style === 'team' ? STAFF_TEAM_DISPLAY_NAME : STAFF_PUBLIC_DISPLAY_NAME
}

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