import type { NextRequest } from 'next/server'

/** Canonical public site origin (no trailing slash). */
export function getAppBaseUrl(req?: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (fromEnv) return fromEnv

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  if (req) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
    const proto = req.headers.get('x-forwarded-proto') || 'https'
    if (host) return `${proto}://${host}`
  }

  return 'http://localhost:3000'
}