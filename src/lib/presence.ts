export const ONLINE_THRESHOLD_MS = 5 * 60 * 1000
export const HEARTBEAT_INTERVAL_MS = 60 * 1000
export const HEARTBEAT_SERVER_THROTTLE_MS = 45 * 1000

export function onlineSinceDate(now = Date.now()): Date {
  return new Date(now - ONLINE_THRESHOLD_MS)
}

export function isUserOnline(lastActiveAt: Date | string | null | undefined, now = Date.now()): boolean {
  if (!lastActiveAt) return false
  const ts = typeof lastActiveAt === 'string' ? new Date(lastActiveAt).getTime() : lastActiveAt.getTime()
  return now - ts <= ONLINE_THRESHOLD_MS
}

export function shouldUpdateLastActive(
  lastActiveAt: Date | null | undefined,
  now = Date.now()
): boolean {
  if (!lastActiveAt) return true
  return now - lastActiveAt.getTime() >= HEARTBEAT_SERVER_THROTTLE_MS
}

export function formatRelativeActive(lastActiveAt: Date | string | null | undefined): string {
  if (!lastActiveAt) return '—'
  const ts = typeof lastActiveAt === 'string' ? new Date(lastActiveAt).getTime() : lastActiveAt.getTime()
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (diffSec < 30) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin === 1) return '1 min ago'
  if (diffMin < 60) return `${diffMin} min ago`
  return new Date(ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}