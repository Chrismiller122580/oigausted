import { prisma } from '@/lib/prisma'
import { notifications } from '@/lib/notifications'
import {
  OrderStatusLabel,
  labelToPrismaStatus,
  prismaStatusToLabel,
} from '@/lib/order-status'
import { devLog } from '@/lib/utils'

/** Kind stored on Notification.data for dedup. */
export const SELLER_OPEN_ORDERS_REMINDER_KIND = 'seller_open_orders_reminder'

/** Min gap between reminders for the same seller (once a day). */
export const REMINDER_COOLDOWN_MS = 23 * 60 * 60 * 1000

const DEFAULT_SELLER_LIMIT = 500

export type OpenOrdersReminderResult = {
  dryRun: boolean
  eligible: number
  sent: number
  skipped: number
  failed: number
  sample?: Array<{
    sellerId: string
    openCount: number
    paidCount: number
    inProgressCount: number
  }>
}

type OpenOrderRow = {
  id: string
  sellerId: string
  status: string
  gig: { title: string } | null
}

function openOrderStatuses() {
  return [
    labelToPrismaStatus(OrderStatusLabel.Paid),
    labelToPrismaStatus(OrderStatusLabel.InProgress),
  ]
}

/**
 * Sellers who already received an open-orders reminder in the cooldown window.
 * Scans recent order notifications and filters by data.kind (works on SQLite + Postgres).
 */
async function getRecentlyRemindedSellerIds(since: Date): Promise<Set<string>> {
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
    if (data?.kind === SELLER_OPEN_ORDERS_REMINDER_KIND) {
      ids.add(row.userId)
    }
  }
  return ids
}

function buildCopy(opts: {
  openCount: number
  paidCount: number
  inProgressCount: number
  gigTitles: string[]
  firstOrderId: string
}): { title: string; message: string; link: string } {
  const { openCount, paidCount, inProgressCount, gigTitles, firstOrderId } = opts
  const n = openCount
  const title =
    n === 1 ? 'Tienes 1 pedido abierto' : `Tienes ${n} pedidos abiertos`

  const parts: string[] = []
  if (paidCount > 0) {
    parts.push(
      paidCount === 1
        ? '1 pagado listo para iniciar'
        : `${paidCount} pagados listos para iniciar`,
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

  const message =
    n === 1
      ? `Tienes un pedido abierto${summary}.${titlesHint} Actualiza el estado o continúa el trabajo para mantener informado al comprador.`
      : `Tienes ${n} pedidos abiertos${summary}.${titlesHint} Revisa y actualiza el estado de cada uno hasta completarlos.`

  const link = n === 1 ? `/orders/${firstOrderId}` : '/seller/orders'

  return { title, message, link }
}

/**
 * Daily job: remind sellers with Paid / In Progress orders once per day until closed.
 */
export async function processSellerOpenOrdersReminders(opts?: {
  dryRun?: boolean
  limit?: number
}): Promise<OpenOrdersReminderResult> {
  const dryRun = opts?.dryRun ?? false
  const limit = opts?.limit ?? DEFAULT_SELLER_LIMIT
  const since = new Date(Date.now() - REMINDER_COOLDOWN_MS)

  const statuses = openOrderStatuses()

  const openOrders = (await prisma.order.findMany({
    where: { status: { in: statuses } },
    select: {
      id: true,
      sellerId: true,
      status: true,
      gig: { select: { title: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })) as OpenOrderRow[]

  const bySeller = new Map<
    string,
    {
      orders: OpenOrderRow[]
      paidCount: number
      inProgressCount: number
    }
  >()

  for (const order of openOrders) {
    const label = prismaStatusToLabel(order.status)
    let bucket = bySeller.get(order.sellerId)
    if (!bucket) {
      bucket = { orders: [], paidCount: 0, inProgressCount: 0 }
      bySeller.set(order.sellerId, bucket)
    }
    bucket.orders.push(order)
    if (label === OrderStatusLabel.Paid) bucket.paidCount++
    else if (label === OrderStatusLabel.InProgress) bucket.inProgressCount++
  }

  const alreadyReminded = await getRecentlyRemindedSellerIds(since)

  const sellerIds = [...bySeller.keys()].slice(0, limit)
  const result: OpenOrdersReminderResult = {
    dryRun,
    eligible: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  }

  const sample: NonNullable<OpenOrdersReminderResult['sample']> = []

  for (const sellerId of sellerIds) {
    const bucket = bySeller.get(sellerId)!
    const openCount = bucket.orders.length
    if (openCount === 0) continue

    if (alreadyReminded.has(sellerId)) {
      result.skipped++
      continue
    }

    result.eligible++

    const gigTitles = bucket.orders
      .map((o) => o.gig?.title)
      .filter((t): t is string => Boolean(t))

    const { title, message, link } = buildCopy({
      openCount,
      paidCount: bucket.paidCount,
      inProgressCount: bucket.inProgressCount,
      gigTitles,
      firstOrderId: bucket.orders[0].id,
    })

    if (dryRun) {
      if (sample.length < 10) {
        sample.push({
          sellerId,
          openCount,
          paidCount: bucket.paidCount,
          inProgressCount: bucket.inProgressCount,
        })
      }
      continue
    }

    try {
      const sendResult = await notifications.sendNotification({
        userId: sellerId,
        category: 'order',
        type: 'in_app',
        priority: 'normal',
        title,
        message,
        link,
        data: {
          kind: SELLER_OPEN_ORDERS_REMINDER_KIND,
          openCount,
          paidCount: bucket.paidCount,
          inProgressCount: bucket.inProgressCount,
          orderIds: bucket.orders.map((o) => o.id).slice(0, 50),
          gigTitles: gigTitles.slice(0, 5),
          recipientRole: 'seller',
          actions: [{ label: 'Ver pedidos', action: 'view_orders' }],
        },
      })

      if (sendResult && 'skipped' in sendResult && sendResult.skipped) {
        result.skipped++
      } else {
        result.sent++
      }
    } catch (err) {
      result.failed++
      devLog('[OpenOrdersReminder] send failed for seller', sellerId, err)
    }
  }

  // Sellers past limit still count as not processed this run (will retry next day)
  const totalSellers = bySeller.size
  if (totalSellers > limit) {
    devLog(
      `[OpenOrdersReminder] capped at ${limit} sellers (${totalSellers} had open orders)`,
    )
  }

  if (dryRun) {
    result.sample = sample
  }

  return result
}
