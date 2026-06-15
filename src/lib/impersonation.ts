import crypto from 'crypto'

const TOKEN_TTL_MS = 5 * 60 * 1000

function getSecret(): string | null {
  return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || null
}

/** Issue a short-lived signed token after admin impersonate API succeeds. */
export function createImpersonationToken(adminId: string, targetUserId: string): string | null {
  const secret = getSecret()
  if (!secret) return null

  const expiresAt = Date.now() + TOKEN_TTL_MS
  const payload = `${adminId}:${targetUserId}:${expiresAt}`
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return Buffer.from(`${payload}:${sig}`).toString('base64url')
}

/** Verify token from session.update(); returns admin + target ids or null. */
export function verifyImpersonationToken(token: string): { adminId: string; targetUserId: string } | null {
  const secret = getSecret()
  if (!secret || !token) return null

  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const lastColon = decoded.lastIndexOf(':')
    if (lastColon === -1) return null

    const payload = decoded.slice(0, lastColon)
    const sig = decoded.slice(lastColon + 1)
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')

    if (sig.length !== expected.length) return null
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null

    const [adminId, targetUserId, expiresAtStr] = payload.split(':')
    if (!adminId || !targetUserId || !expiresAtStr) return null

    const expiresAt = Number(expiresAtStr)
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null

    return { adminId, targetUserId }
  } catch {
    return null
  }
}