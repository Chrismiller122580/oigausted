import { prisma } from '@/lib/prisma'

const WINDOW_MS = 15 * 60 * 1000
const MAX_GENERATE = 20
const MAX_MATCH = 40

export async function checkDocumentAiRateLimit(
  userId: string,
  action: 'DOCUMENT_AI_GENERATE' | 'DOCUMENT_AI_MATCH',
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  const max = action === 'DOCUMENT_AI_GENERATE' ? MAX_GENERATE : MAX_MATCH
  const since = new Date(Date.now() - WINDOW_MS)
  try {
    const count = await prisma.auditLog.count({
      where: {
        action,
        performedById: userId,
        createdAt: { gte: since },
      },
    })
    if (count >= max) {
      return { allowed: false, retryAfterSec: Math.ceil(WINDOW_MS / 1000) }
    }
    await prisma.auditLog.create({
      data: {
        action,
        targetType: 'User',
        targetId: userId,
        performedById: userId,
        details: { action },
      },
    })
    return { allowed: true }
  } catch {
    return { allowed: true }
  }
}