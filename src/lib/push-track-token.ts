import { createHmac, timingSafeEqual } from 'crypto'

/**
 * HMAC token so the service worker can report push delivery/clicks
 * without an open unauthenticated write on notification rows.
 */
function secret(): string {
  return (
    process.env.PUSH_TRACK_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.CRON_SECRET ||
    ''
  )
}

export function createPushTrackToken(notificationId: string): string | null {
  const s = secret()
  if (!s || !notificationId) return null
  return createHmac('sha256', s).update(`push-track:${notificationId}`).digest('hex')
}

export function verifyPushTrackToken(
  notificationId: string,
  token: string | null | undefined,
): boolean {
  if (!token || !notificationId) return false
  const expected = createPushTrackToken(notificationId)
  if (!expected) return false
  try {
    const a = Buffer.from(expected, 'utf8')
    const b = Buffer.from(token, 'utf8')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}
