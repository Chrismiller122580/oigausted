import { prisma } from '@/lib/prisma'
import { shouldUpdateLastActive } from '@/lib/presence'

/** Throttled lastActiveAt update — safe to call from heartbeat and SSE connect. */
export async function touchUserPresence(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastActiveAt: true },
  })

  if (!user || !shouldUpdateLastActive(user.lastActiveAt)) {
    return false
  }

  await prisma.user.update({
    where: { id: userId },
    data: { lastActiveAt: new Date() },
  })

  return true
}