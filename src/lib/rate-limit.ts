import { prisma } from '@/lib/prisma'
import { isSqliteDatabase } from '@/lib/utils'

export type RateLimitAction =
  | 'SIGNUP_ATTEMPT'
  | 'LOGIN_ATTEMPT'
  | 'LOGIN_FAILURE'
  | 'LOGIN_SUCCESS'
  | 'PASSWORD_RESET_ATTEMPT'

const DEFAULT_WINDOW_MS = 15 * 60 * 1000

export function getRequestIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}

type RateLimitOptions = {
  action: RateLimitAction | RateLimitAction[]
  windowMs?: number
  maxAttempts: number
  ip?: string
  email?: string
}

/** Audit-log backed rate limit (works across serverless instances). */
export async function checkRateLimit(
  opts: RateLimitOptions
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const windowMs = opts.windowMs ?? DEFAULT_WINDOW_MS
  const since = new Date(Date.now() - windowMs)
  const actions = Array.isArray(opts.action) ? opts.action : [opts.action]

  // Postgres: JSON path filter on details.email.
  // SQLite (local dev): details is stored as a string — use string contains instead.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {
    action: { in: actions },
    createdAt: { gte: since },
  }

  if (opts.ip && opts.ip !== 'unknown') {
    where.ipAddress = opts.ip
  }

  if (opts.email) {
    const email = opts.email.toLowerCase()
    if (isSqliteDatabase()) {
      // details is a JSON string in local sqlite shim
      where.details = { contains: `"email":"${email}"` }
    } else {
      where.details = { path: ['email'], equals: email }
    }
  }

  try {
    const count = await prisma.auditLog.count({ where })
    if (count >= opts.maxAttempts) {
      return { allowed: false, retryAfter: Math.ceil(windowMs / 1000) }
    }
    return { allowed: true }
  } catch (err) {
    // Never block login if rate-limit storage is misconfigured (e.g. schema drift).
    console.warn('[rate-limit] check failed; allowing request:', err)
    return { allowed: true }
  }
}

export const RATE_LIMITS = {
  signupPerIp: { max: 5, windowMs: DEFAULT_WINDOW_MS },
  loginPerIp: { max: 25, windowMs: DEFAULT_WINDOW_MS },
  loginPerEmail: { max: 10, windowMs: DEFAULT_WINDOW_MS },
  passwordResetPerIp: { max: 5, windowMs: DEFAULT_WINDOW_MS },
} as const