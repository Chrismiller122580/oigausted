/**
 * Normalize admin-configured logo URLs for safe client rendering.
 * Rejects local dev filesystem paths.
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
    return trimmed.replace(/^\/public\//, '/')
  }

  return null
}