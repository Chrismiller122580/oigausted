import crypto from 'crypto'

/** Short-lived token to move a session from the system browser into the Capacitor WebView. */
const TOKEN_TTL_MS = 90 * 1000

function getSecret(): string | null {
  return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || null
}

export function createMobileAuthToken(userId: string): string | null {
  const secret = getSecret()
  if (!secret || !userId) return null

  const expiresAt = Date.now() + TOKEN_TTL_MS
  const payload = `${userId}:${expiresAt}`
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return Buffer.from(`${payload}:${sig}`).toString('base64url')
}

export function verifyMobileAuthToken(token: string): { userId: string } | null {
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

    const [userId, expiresAtStr] = payload.split(':')
    if (!userId || !expiresAtStr) return null

    const expiresAt = Number(expiresAtStr)
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null

    return { userId }
  } catch {
    return null
  }
}