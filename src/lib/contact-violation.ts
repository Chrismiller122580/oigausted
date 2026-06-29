import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { logAuditEvent } from '@/lib/audit'
import { notifyAdminsContactViolation } from '@/lib/admin-notifications'
import { redactSnippet, type ContactViolationType } from '@/lib/contact-moderation'

export type ContactViolationContextType = 'order' | 'inquiry'

export async function recordContactViolation(
  userId: string,
  contextType: ContactViolationContextType,
  contextId: string,
  types: ContactViolationType[],
  snippet: string
): Promise<{ violationCount: number; flagged: boolean }> {
  const redacted = redactSnippet(snippet)

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.contactViolation.create({
      data: {
        userId,
        contextType,
        contextId,
        violationTypes: types,
        snippet: redacted,
      },
    })

    const user = await tx.user.update({
      where: { id: userId },
      data: { contactViolationCount: { increment: 1 } },
      select: {
        contactViolationCount: true,
        contactFlaggedAt: true,
        name: true,
        email: true,
      },
    })

    const flagged = user.contactViolationCount >= 3
    if (flagged && !user.contactFlaggedAt) {
      await tx.user.update({
        where: { id: userId },
        data: { contactFlaggedAt: new Date() },
      })
    }

    return {
      violationCount: user.contactViolationCount,
      flagged,
      userName: user.name,
      userEmail: user.email,
    }
  })

  await logAuditEvent({
    performedById: userId,
    action: 'CONTACT_VIOLATION_ATTEMPT',
    targetType: contextType === 'order' ? 'Order' : 'InquiryThread',
    targetId: contextId,
    details: {
      violationTypes: types,
      snippet: redacted,
      violationCount: result.violationCount,
      flagged: result.flagged,
    },
  })

  notifyAdminsContactViolation({
    userId,
    userName: result.userName,
    userEmail: result.userEmail,
    contextType,
    contextId,
    violationTypes: types,
    snippet: redacted,
    violationCount: result.violationCount,
    flagged: result.flagged,
  }).catch(() => {})

  return { violationCount: result.violationCount, flagged: result.flagged }
}