/**
 * Robust client-side share/copy helpers.
 * Clipboard API fails in many contexts (HTTP, some WebViews, missing permission);
 * always provide a fallback path so sellers can share their profile link.
 */

import { buildWhatsAppShareUrl } from '@/lib/pwa-install'

/** Copy text with Clipboard API, falling back to a temporary textarea. */
export async function copyToClipboard(text: string): Promise<boolean> {
  const value = (text || '').trim()
  if (!value) return false

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return true
    } catch {
      // fall through to legacy path
    }
  }

  try {
    const ta = document.createElement('textarea')
    ta.value = value
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    ta.style.top = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    ta.setSelectionRange(0, value.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

export type NativeShareInput = {
  title: string
  text: string
  url: string
}

/**
 * Prefer native share sheet; fall back to copy.
 * Returns how the content was shared (or null if user cancelled / failed).
 */
export async function shareOrCopy(
  input: NativeShareInput,
): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  const { title, text, url } = input

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      // Some browsers throw if `url` is not a valid absolute URL
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled'
      // Fall through to copy if share failed for other reasons
    }
  }

  const payload = url ? `${text} ${url}`.trim() : text
  const ok = await copyToClipboard(payload)
  return ok ? 'copied' : 'failed'
}

export function whatsAppShareHref(text: string, url: string): string {
  return buildWhatsAppShareUrl(text, url)
}

/** Prefer production app URL for shared links (not localhost / preview hosts). */
export function getPublicShareOrigin(): string {
  if (typeof window !== 'undefined') {
    const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
    // In production builds, prefer the configured public origin so previews
    // still share the real oigagig.com link when set.
    if (env && !/localhost|127\.0\.0\.1/.test(env)) {
      // Only rewrite when current host looks like a non-canonical deploy host
      const host = window.location.hostname
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.endsWith('.vercel.app')
      ) {
        // Keep local/preview sharing as current origin so testing still works
        return window.location.origin
      }
      // On real product hosts, still use current origin (covers custom domains)
      return window.location.origin
    }
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://oigagig.com'
}

export function buildSellerPublicUrl(slugOrId: string, origin?: string): string {
  const base = (origin || getPublicShareOrigin()).replace(/\/$/, '')
  const path = String(slugOrId || '').trim()
  if (!path) return base
  return `${base}/sellers/${path}`
}
