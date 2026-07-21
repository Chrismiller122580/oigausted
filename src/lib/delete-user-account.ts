import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { logAuditEvent } from '@/lib/audit'
import { isSqliteDatabase } from '@/lib/utils'
import { OrderStatusLabel, labelToPrismaStatus } from '@/lib/order-status'

export type DeleteAccountResult =
  | {
      ok: true
      mode: 'hard_deleted' | 'anonymized'
      deleteAllData: boolean
      softDeletedGigs: number
    }
  | {
      ok: false
      code: 'NOT_FOUND' | 'LAST_ADMIN' | 'OPEN_ORDERS' | 'ALREADY_DELETED'
      message: string
      openOrders?: number
    }

export type DeleteAccountOptions = {
  deleteAllData: boolean
  ipAddress?: string | null
  userAgent?: string | null
}

/** Order statuses that block account deletion until resolved. */
function openOrderStatuses(): string[] {
  const labels = [
    OrderStatusLabel.Pending,
    OrderStatusLabel.Paid,
    OrderStatusLabel.InProgress,
  ] as const
  // Include both Prisma enum values and UI labels so sqlite + postgres both match.
  const values = new Set<string>()
  for (const label of labels) {
    values.add(label)
    values.add(labelToPrismaStatus(label))
  }
  return [...values]
}

/**
 * Self-service account deletion for Play Store / privacy compliance.
 *
 * - Always ends login access (sessions, OAuth accounts, password).
 * - Soft-deletes the user's gigs.
 * - Blocks when open marketplace orders exist.
 * - With deleteAllData: scrubs PII and removes personal app data.
 * - Hard-deletes the User row only when there is no residual marketplace history.
 */
export async function deleteUserAccount(
  userId: string,
  options: DeleteAccountOptions
): Promise<DeleteAccountResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      name: true,
    },
  })

  if (!user) {
    return { ok: false, code: 'NOT_FOUND', message: 'Usuario no encontrado' }
  }

  // Already fully scrubbed / closed
  if (
    user.isActive === false &&
    typeof user.email === 'string' &&
    user.email.endsWith('@deleted.local')
  ) {
    return {
      ok: false,
      code: 'ALREADY_DELETED',
      message: 'Esta cuenta ya fue eliminada',
    }
  }

  if (user.role === 'admin') {
    const adminCount = await prisma.user.count({
      where: { role: 'admin', isActive: true },
    })
    if (adminCount <= 1) {
      return {
        ok: false,
        code: 'LAST_ADMIN',
        message:
          'No se puede eliminar la única cuenta de administrador activa. Asigna otro admin primero.',
      }
    }
  }

  const openStatuses = openOrderStatuses()
  const openOrders = await prisma.order.count({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
      status: { in: openStatuses as never[] },
    },
  })

  if (openOrders > 0) {
    return {
      ok: false,
      code: 'OPEN_ORDERS',
      message: `Tienes ${openOrders} pedido(s) en curso. Complétalos o cancélalos antes de eliminar la cuenta.`,
      openOrders,
    }
  }

  const [gigCount, orderCount, reviewAsSeller, reviewAsBuyer, referralEarningCount] =
    await Promise.all([
      prisma.gig.count({ where: { sellerId: userId } }),
      prisma.order.count({
        where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      }),
      prisma.review.count({ where: { sellerId: userId } }),
      prisma.review.count({ where: { reviewerId: userId } }),
      prisma.referralEarning.count({ where: { referrerId: userId } }),
    ])

  // Residual rows that still reference User without onDelete: Cascade
  const hasResidualHistory =
    gigCount > 0 ||
    orderCount > 0 ||
    reviewAsSeller > 0 ||
    reviewAsBuyer > 0 ||
    referralEarningCount > 0

  const now = new Date()
  let softDeletedGigs = 0

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Soft-delete gigs (keep order FK integrity)
    const gigs = await tx.gig.updateMany({
      where: { sellerId: userId, deletedAt: null },
      data: { isActive: false, deletedAt: now },
    })
    softDeletedGigs = gigs.count

    // Always revoke auth surfaces
    await tx.session.deleteMany({ where: { userId } })
    await tx.account.deleteMany({ where: { userId } })
    await tx.passwordResetToken.deleteMany({ where: { userId } })
    await tx.pushSubscription.deleteMany({ where: { userId } })

    if (options.deleteAllData) {
      await tx.notification.deleteMany({ where: { userId } })
      await tx.notificationPreference.deleteMany({ where: { userId } })
      await tx.supportTicket.deleteMany({ where: { userId } })
      await tx.contactViolation.deleteMany({ where: { userId } })
      await tx.sellerMarketingGeneration.deleteMany({ where: { userId } })
      await tx.sellerMarketingSubscription.deleteMany({ where: { userId } })

      // Pre-order chats owned as buyer; seller threads stay for the other party until cascade via anonymized user
      await tx.inquiryThread.deleteMany({ where: { buyerId: userId } })

      // Scrub free-text reviews this user wrote (keep star ratings for marketplace integrity)
      await tx.review.updateMany({
        where: { reviewerId: userId },
        data: { comment: null },
      })

      // Detach referral tree (self-referential FK blocks hard delete)
      await tx.user.updateMany({
        where: { referredById: userId },
        data: { referredById: null },
      })
    }

    if (!hasResidualHistory) {
      // Safe hard delete — cascades cover remaining personal rows
      if (options.deleteAllData) {
        // Detach self-referential referrals just in case
        await tx.user.updateMany({
          where: { referredById: userId },
          data: { referredById: null },
        })
      }
      // Clear optional FKs that use SetNull or plain refs before delete
      await tx.marketingCampaign.updateMany({
        where: { sentById: userId },
        data: { sentById: null },
      })
      await tx.userLensReport.updateMany({
        where: { scannedById: userId },
        data: { scannedById: null },
      })
      await tx.userLensFixItem.updateMany({
        where: { reviewedById: userId },
        data: { reviewedById: null },
      })
      // Audit logs: null actor so we can delete the user
      await tx.auditLog.updateMany({
        where: { performedById: userId },
        data: { performedById: null },
      })
      await tx.auditLog.updateMany({
        where: { adminId: userId },
        data: { adminId: null },
      })

      await tx.user.delete({ where: { id: userId } })
      return
    }

    // Close account while preserving order/gig history for other parties & legal records.
    // Email is always freed so the user can re-register later.
    const anonymizedEmail = `deleted_${userId.replace(/-/g, '').slice(0, 16)}@deleted.local`

    const baseClose = {
      isActive: false,
      password: null as string | null,
      email: anonymizedEmail,
      name: 'Usuario eliminado',
      // Always strip credentials / bank data
      payoutBankCode: null as string | null,
      payoutAccountNumber: null as string | null,
      payoutAccountType: null as string | null,
      payoutHolderName: null as string | null,
      payoutDocumentType: null as string | null,
      payoutDocumentNumber: null as string | null,
      payoutPhone: null as string | null,
      payoutEmail: null as string | null,
      lastLoginAt: null as Date | null,
      lastLoginIp: null as string | null,
      lastLoginCity: null as string | null,
      lastLoginUserAgent: null as string | null,
      lastActiveAt: null as Date | null,
      referralCode: null as string | null,
      staffRole: null as string | null,
      phone: null as string | null,
      whatsapp: null as string | null,
    }

    const fullDataWipe = options.deleteAllData
      ? {
          tagline: null as string | null,
          idNumber: null as string | null,
          address: null as string | null,
          instagram: null as string | null,
          facebook: null as string | null,
          businessName: null as string | null,
          slug: null as string | null,
          nit: null as string | null,
          bio: null as string | null,
          profilePicture: null as string | null,
          coverImageUrl: null as string | null,
          city: null as string | null,
          latitude: null as number | null,
          longitude: null as number | null,
          serviceRadiusKm: null as number | null,
          customReferralRate: null as number | null,
          contactViolationCount: 0,
          contactFlaggedAt: null as Date | null,
        }
      : {}

    await tx.user.update({
      where: { id: userId },
      data: { ...baseClose, ...fullDataWipe },
    })
  })

  await logAuditEvent({
    performedById: hasResidualHistory ? userId : null,
    action: options.deleteAllData ? 'ACCOUNT_DELETED_WITH_DATA' : 'ACCOUNT_DELETED',
    targetType: 'User',
    targetId: userId,
    details: {
      email: user.email,
      deleteAllData: options.deleteAllData,
      mode: hasResidualHistory ? 'anonymized' : 'hard_deleted',
      softDeletedGigs,
      hadOrders: orderCount > 0,
      hadGigs: gigCount > 0,
      sqlite: isSqliteDatabase(),
    },
    ipAddress: options.ipAddress ?? null,
    userAgent: options.userAgent ?? null,
  })

  return {
    ok: true,
    mode: hasResidualHistory ? 'anonymized' : 'hard_deleted',
    deleteAllData: options.deleteAllData,
    softDeletedGigs,
  }
}
