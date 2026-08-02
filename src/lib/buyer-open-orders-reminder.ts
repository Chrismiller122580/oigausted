import { prisma } from '@/lib/prisma'
import { notifications } from '@/lib/notifications'
import {
  OrderStatusLabel,
  labelToPrismaStatus,
  prismaStatusToLabel,
} from '@/lib/order-status'
import { devLog } from '@/lib/utils'

/** Kind stored on Notification.data for dedup. */
export const BUYER_OPEN_ORDERS_REMINDER_KIND = 'buyer_open_orders_reminder'

/** Min gap between reminders for the same buyer (once a day). */
export const REMINDER_COOLDOWN_MS = 23 * 60 * 60 * 1000

const DEFAULT_BUYER_LIMIT = 500

export type BuyerOpenOrdersReminderResult = {
  dryRun: boolean
  eligible: number
  sent: number
  skipped: number
  failed: number
  sample?: Array<{
    buyerId: string
    openCount: number
    pendingCount: number
    paidCount: number
    inProgressCount: number
  }>
}

type OpenOrderRow = {
  id: string
  buyerId: string
  status: string
  gig: { title: string } | null
}

/** Buyer-actionable / trackable open orders until closed. */
function openOrderStatuses() {
  return [
    labelToPrismaStatus(OrderStatusLabel.Pending),
    labelToPrismaStatus(OrderStatusLabel.Paid),
    labelToPrismaStatus(OrderStatusLabel.InProgress),
  ]
}

/**
 * Buyers who already received an open-orders reminder in the cooldown window.
 * Scans recent order notifications and filters by data.kind (SQLite + Postgres).
 */
async function getRecentlyRemindedBuyerIds(since: Date): Promise<Set<string>> {
  const rows = await prisma.notification.findMany({
    where: {
      category: 'order',
      createdAt: { gte: since },
    },
    select: { userId: true, data: true },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  })

  const ids = new Set<string>()
  for (const row of rows) {
    const data = row.data as Record<string, unknown> | null
    if (data?.kind === BUYER_OPEN_ORDERS_REMINDER_KIND) {
      ids.add(row.userId)
    }
  }
  return ids
}

function buildCopy(opts: {
  openCount: number
  pendingCount: number
  paidCount: number
  inProgressCount: number
  gigTitles: string[]
  firstOrderId: string
}): { title: string; message: string; link: string } {
  const {
    openCount,
    pendingCount,
    paidCount,
    inProgressCount,
    gigTitles,
    firstOrderId,
  } = opts
  const n = openCount
  const title =
    n === 1 ? 'Tienes 1 pedido abierto' : `Tienes ${n} pedidos abiertos`

  const parts: string[] = []
  if (pendingCount > 0) {
    parts.push(
      pendingCount === 1
        ? '1 pendiente de pago'
        : `${pendingCount} pendientes de pago`,
    )
  }
  if (paidCount > 0) {
    parts.push(
      paidCount === 1
        ? '1 pagado (esperando al vendedor)'
        : `${paidCount} pagados (esperando al vendedor)`,
    )
  }
  if (inProgressCount > 0) {
    parts.push(
      inProgressCount === 1
        ? '1 en progreso'
        : `${inProgressCount} en progreso`,
    )
  }

  const summary = parts.length > 0 ? ` (${parts.join(', ')})` : ''
  const sampleTitles = gigTitles.slice(0, 3)
  const titlesHint =
    sampleTitles.length > 0
      ? ` Incluye: ${sampleTitles.map((t) => `"${t}"`).join(', ')}${
          gigTitles.length > 3 ? '…' : ''
        }.`
      : ''

  let actionHint: string
  if (pendingCount > 0 && pendingCount === n) {
    actionHint =
      ' Completa el pago seguro para que el vendedor pueda iniciar el trabajo.'
  } else if (pendingCount > 0) {
    actionHint =
      ' Completa los pagos pendientes y revisa el estado de tus pedidos activos.'
  } else {
    actionHint =
      ' Revisa el progreso y chatea con el vendedor si necesitas actualizar algo.'
  }

  const message =
    n === 1
      ? `Tienes un pedido abierto${summary}.${titlesHint}${actionHint}`
      : `Tienes ${n} pedidos abiertos${summary}.${titlesHint}${actionHint}`

  const link = n === 1 ? `/orders/${firstOrderId}` : '/orders'

  return { title, message, link }
}

/**
 * Daily job: remind buyers with Pending / Paid / In Progress orders once per day until closed.
 */
export async function processBuyerOpenOrdersReminders(opts?: {
  dryRun?: boolean
  limit?: number
}): Promise<BuyerOpenOrdersReminderResult> {
  const dryRun = opts?.dryRun ?? false
  const limit = opts?.limit ?? DEFAULT_BUYER_LIMIT
  const since = new Date(Date.now() - REMINDER_COOLDOWN_MS)

  const statuses = openOrderStatuses()

  const openOrders = (await prisma.order.findMany({
    where: { status: { in: statuses } },
    select: {
      id: true,
      buyerId: true,
      status: true,
      gig: { select: { title: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })) as OpenOrderRow[]

  const byBuyer = new Map<
    string,
    {
      orders: OpenOrderRow[]
      pendingCount: number
      paidCount: number
      inProgressCount: number
    }
  >()

  for (const order of openOrders) {
    const label = prismaStatusToLabel(order.status)
    let bucket = byBuyer.get(order.buyerId)
    if (!bucket) {
      bucket = {
        orders: [],
        pendingCount: 0,
        paidCount: 0,
        inProgressCount: 0,
      }
      byBuyer.set(order.buyerId, bucket)
    }
    bucket.orders.push(order)
    if (label === OrderStatusLabel.Pending) bucket.pendingCount++
    else if (label === OrderStatusLabel.Paid) bucket.paidCount++
    else if (label === OrderStatusLabel.InProgress) bucket.inProgressCount++
  }

  const alreadyReminded = await getRecentlyRemindedBuyerIds(since)

  const buyerIds = [...byBuyer.keys()].slice(0, limit)
  const result: BuyerOpenOrdersReminderResult = {
    dryRun,
    eligible: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  }

  const sample: NonNullable<BuyerOpenOrdersReminderResult['sample']> = []

  for (const buyerId of buyerIds) {
    const bucket = byBuyer.get(buyerId)!
    const openCount = bucket.orders.length
    if (openCount === 0) continue

    if (alreadyReminded.has(buyerId)) {
      result.skipped++
      continue
    }

    result.eligible++

    const gigTitles = bucket.orders
      .map((o) => o.gig?.title)
      .filter((t): t is string => Boolean(t))

    const { title, message, link } = buildCopy({
      openCount,
      pendingCount: bucket.pendingCount,
      paidCount: bucket.paidCount,
      inProgressCount: bucket.inProgressCount,
      gigTitles,
      firstOrderId: bucket.orders[0].id,
    })

    if (dryRun) {
      if (sample.length < 10) {
        sample.push({
          buyerId,
          openCount,
          pendingCount: bucket.pendingCount,
          paidCount: bucket.paidCount,
          inProgressCount: bucket.inProgressCount,
        })
      }
      continue
    }

    try {
      const sendResult = await notifications.sendNotification({
        userId: buyerId,
        category: 'order',
        type: 'in_app',
        priority: 'normal',
        title,
        message,
        link,
        data: {
          kind: BUYER_OPEN_ORDERS_REMINDER_KIND,
          openCount,
          pendingCount: bucket.pendingCount,
          paidCount: bucket.paidCount,
          inProgressCount: bucket.inProgressCount,
          orderIds: bucket.orders.map((o) => o.id).slice(0, 50),
          gigTitles: gigTitles.slice(0, 5),
          recipientRole: 'buyer',
          actions: [{ label: 'Ver mis pedidos', action: 'view_orders' }],
        },
      })

      if (sendResult && 'skipped' in sendResult && sendResult.skipped) {
        result.skipped++
      } else {
        result.sent++
      }
    } catch (err) {
      result.failed++
      devLog('[OpenOrdersReminder] send failed for buyer', buyerId, err)
    }
  }

  const totalBuyers = byBuyer.size
  if (totalBuyers > limit) {
    devLog(
      `[OpenOrdersReminder] capped at ${limit} buyers (${totalBuyers} had open orders)`,
    )
  }

  if (dryRun) {
    result.sample = sample
  }

  return result
}
