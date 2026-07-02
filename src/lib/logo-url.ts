/** PWA / favicon assets — not valid nav or marketing logos */
const LEGACY_APP_ICON_PATHS = new Set(['/icon.png', '/apple-icon.png', '/favicon.ico'])

/**
 * Normalize admin-configured logo URLs for safe client rendering.
 * Rejects local dev filesystem paths and legacy app-icon paths used by mistake.
 */
export function sanitizeLogoUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null

  const trimmed = url.trim()
  if (!trimmed) return null

  if (
    trimmed.includes('/workspaces/') ||
    trimmed.includes('\\') ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('//')
  ) {
    return null
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      return new URL(trimmed).toString()
    } catch {
      return null
    }
  }

  if (trimmed.startsWith('/')) {
    if (trimmed.includes('..')) return null
    const normalized = trimmed.replace(/^\/public\//, '/')
    if (LEGACY_APP_ICON_PATHS.has(normalized)) return null
    return normalized
  }

  return null
}