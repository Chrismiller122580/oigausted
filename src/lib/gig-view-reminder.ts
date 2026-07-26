import { prisma } from '@/lib/prisma'
import { notifications } from '@/lib/notifications'
import { devLog } from '@/lib/utils'

/** Count a new visit only if the last one was at least this long ago (avoids refresh spam). */
export const GIG_VIEW_DEBOUNCE_MS = 30 * 60 * 1000 // 30 minutes

/** Send a reminder after this many distinct visits. */
export const GIG_VIEW_REMINDER_THRESHOLD = 2

/** Lifecycle sweep: only remind if last view was at least this old (not mid-browse). */
export const GIG_VIEW_REMINDER_MIN_IDLE_MS = 60 * 60 * 1000 // 1 hour

export type RecordGigViewResult = {
  counted: boolean
  viewCount: number
  reminderSent: boolean
  skipped?: string
}

/**
 * Record a logged-in user's visit to a gig and send a one-time multi-visit reminder
 * when they hit the threshold (and have not ordered that gig).
 */
export async function recordGigViewAndMaybeRemind(
  userId: string,
  gigId: string,
): Promise<RecordGigViewResult> {
  const gig = await prisma.gig.findUnique({
    where: { id: gigId },
    select: {
      id: true,
      title: true,
      price: true,
      isActive: true,
      deletedAt: true,
      sellerId: true,
      seller: { select: { businessName: true, name: true } },
    },
  })

  if (!gig || gig.deletedAt || !gig.isActive) {
    return { counted: false, viewCount: 0, reminderSent: false, skipped: 'gig unavailable' }
  }

  if (gig.sellerId === userId) {
    return { counted: false, viewCount: 0, reminderSent: false, skipped: 'own gig' }
  }

  const now = new Date()
  const existing = await prisma.gigView.findUnique({
    where: { userId_gigId: { userId, gigId } },
  })

  let viewCount: number
  let counted: boolean

  if (!existing) {
    const created = await prisma.gigView.create({
      data: {
        userId,
        gigId,
        viewCount: 1,
        firstViewedAt: now,
        lastViewedAt: now,
      },
    })
    viewCount = created.viewCount
    counted = true
  } else {
    const msSinceLast = now.getTime() - existing.lastViewedAt.getTime()
    if (msSinceLast < GIG_VIEW_DEBOUNCE_MS) {
      // Soft touch: update lastViewedAt only so activity is fresh, no new visit count
      await prisma.gigView.update({
        where: { id: existing.id },
        data: { lastViewedAt: now },
      })
      return {
        counted: false,
        viewCount: existing.viewCount,
        reminderSent: false,
        skipped: 'debounced',
      }
    }

    const updated = await prisma.gigView.update({
      where: { id: existing.id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: now,
      },
    })
    viewCount = updated.viewCount
    counted = true
  }

  if (viewCount < GIG_VIEW_REMINDER_THRESHOLD) {
    return { counted, viewCount, reminderSent: false }
  }

  const reminderSent = await maybeSendMultiVisitReminder(userId, gigId, {
    title: gig.title,
    price: gig.price,
    sellerName: gig.seller?.businessName || gig.seller?.name || null,
  })

  return { counted, viewCount, reminderSent }
}

type GigReminderContext = {
  title: string
  price: number
  sellerName?: string | null
}

/**
 * Send the multi-visit reminder if eligible. Idempotent via reminderSentAt.
 */
export async function maybeSendMultiVisitReminder(
  userId: string,
  gigId: string,
  gigCtx?: GigReminderContext,
): Promise<boolean> {
  const view = await prisma.gigView.findUnique({
    where: { userId_gigId: { userId, gigId } },
  })
  if (!view) return false
  if (view.viewCount < GIG_VIEW_REMINDER_THRESHOLD) return false
  if (view.reminderSentAt) return false

  // Already ordered this gig → no nag
  const existingOrder = await prisma.order.findFirst({
    where: { buyerId: userId, gigId },
    select: { id: true },
  })
  if (existingOrder) {
    await prisma.gigView.update({
      where: { id: view.id },
      data: { reminderSentAt: new Date() }, // mark so we don't keep checking
    })
    return false
  }

  let resolvedTitle = gigCtx?.title
  let resolvedPrice = gigCtx?.price
  let resolvedSellerName = gigCtx?.sellerName

  if (!resolvedTitle) {
    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      select: {
        title: true,
        price: true,
        isActive: true,
        deletedAt: true,
        seller: { select: { businessName: true, name: true } },
      },
    })
    if (!gig || gig.deletedAt || !gig.isActive) return false
    resolvedTitle = gig.title
    resolvedPrice = gig.price
    resolvedSellerName = gig.seller?.businessName || gig.seller?.name || null
  }

  const gigTitle = resolvedTitle
  if (!gigTitle) return false

  const link = `/gigs/${gigId}`
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com').replace(/\/$/, '')
  const ctaUrl = `${appUrl}${link}`
  const priceLabel =
    typeof resolvedPrice === 'number' ? `$${resolvedPrice.toLocaleString('es-CO')}` : ''
  const sellerBit = resolvedSellerName ? ` de ${resolvedSellerName}` : ''

  const notifTitle = '¿Todavía te interesa este servicio?'
  const notifMessage = [
    `Visitaste "${gigTitle}"${sellerBit} varias veces.`,
    priceLabel ? `Desde ${priceLabel} COP.` : '',
    'Sigue disponible — completa tu pedido cuando quieras.',
  ]
    .filter(Boolean)
    .join(' ')

  try {
    // Claim first so concurrent requests don't double-send
    const claimed = await prisma.gigView.updateMany({
      where: { id: view.id, reminderSentAt: null },
      data: { reminderSentAt: new Date() },
    })
    if (claimed.count === 0) return false

    await notifications.sendNotification({
      userId,
      category: 'marketing',
      type: 'in_app',
      title: notifTitle,
      message: notifMessage,
      link,
      priority: 'normal',
      data: {
        playbookId: 'buyers-multi-visit-gig',
        gigId,
        gigTitle,
        ctaLabel: 'Ver servicio',
        ctaUrl,
        isMultiVisitReminder: true,
      },
    })

    // Also attempt email/push via explicit channels (in_app already emails when allowed)
    // sendNotification for in_app already triggers email when emailEnabled — no second call needed.

    return true
  } catch (err) {
    // Roll back claim so lifecycle can retry
    try {
      await prisma.gigView.update({
        where: { id: view.id },
        data: { reminderSentAt: null },
      })
    } catch {
      /* ignore */
    }
    devLog('[GigView] reminder send failed', err)
    return false
  }
}

/**
 * Cron-safe sweep: remind buyers who revisited a gig and left without ordering.
 * Only processes rows idle for GIG_VIEW_REMINDER_MIN_IDLE_MS so we don't interrupt live browsing.
 */
export async function processPendingMultiVisitReminders({
  dryRun = false,
  limit = 50,
}: {
  dryRun?: boolean
  limit?: number
} = {}): Promise<{ eligible: number; sent: number; failed: number }> {
  const idleBefore = new Date(Date.now() - GIG_VIEW_REMINDER_MIN_IDLE_MS)

  let rows: Array<{ id: string; userId: string; gigId: string; viewCount: number }>
  try {
    rows = await prisma.gigView.findMany({
      where: {
        viewCount: { gte: GIG_VIEW_REMINDER_THRESHOLD },
        reminderSentAt: null,
        lastViewedAt: { lte: idleBefore },
      },
      select: { id: true, userId: true, gigId: true, viewCount: true },
      take: limit,
      orderBy: { lastViewedAt: 'asc' },
    })
  } catch (err) {
    devLog('[GigView] pending query failed (table may not exist yet)', err)
    return { eligible: 0, sent: 0, failed: 0 }
  }

  if (dryRun) {
    return { eligible: rows.length, sent: 0, failed: 0 }
  }

  let sent = 0
  let failed = 0
  for (const row of rows) {
    try {
      const ok = await maybeSendMultiVisitReminder(row.userId, row.gigId)
      if (ok) sent += 1
    } catch {
      failed += 1
    }
  }

  return { eligible: rows.length, sent, failed }
}
