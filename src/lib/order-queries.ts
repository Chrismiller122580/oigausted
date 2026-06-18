import { prisma } from '@/lib/prisma'
import { isMissingColumnError } from '@/lib/user-profile-update'
import { labelToPrismaStatus, OrderStatusLabel, prismaStatusToLabel } from '@/lib/order-status'
import type { Prisma } from '@prisma/client'

/** Minimal select for order.create — avoids optional payout columns missing in prod. */
export const orderCreateSelect = {
  id: true,
  buyerId: true,
  sellerId: true,
  gigId: true,
  price: true,
  status: true,
  customFields: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.OrderSelect

type OrderListRow = {
  id: string
  price: number
  status: string
  progress: number
  trackingNumber: string | null
  createdAt: Date
  updatedAt: Date
  buyerId: string
  sellerId: string
  gigId: string
  customFields: string | null
  sellerPayoutAt?: Date | null
  wompiPayoutRef?: string | null
  serviceLatitude?: number | null
  serviceLongitude?: number | null
  serviceAddress?: string | null
  gig: { title: string; imageUrl: string | null }
  buyer: { id: string; name: string | null; email: string | null }
  seller: {
    id: string
    name: string | null
    businessName?: string | null
    referredById?: string | null
    payoutBankCode?: string | null
    payoutAccountNumber?: string | null
    payoutAccountType?: string | null
    payoutHolderName?: string | null
    payoutDocumentType?: string | null
    payoutDocumentNumber?: string | null
  }
}

const orderListSelectTiers: Prisma.OrderSelect[] = [
  {
    id: true,
    price: true,
    status: true,
    progress: true,
    trackingNumber: true,
    createdAt: true,
    updatedAt: true,
    buyerId: true,
    sellerId: true,
    gigId: true,
    customFields: true,
    sellerPayoutAt: true,
    wompiPayoutRef: true,
    serviceLatitude: true,
    serviceLongitude: true,
    serviceAddress: true,
    gig: { select: { title: true, imageUrl: true } },
    buyer: { select: { id: true, name: true, email: true } },
    seller: {
      select: {
        id: true,
        name: true,
        businessName: true,
        referredById: true,
        payoutBankCode: true,
        payoutAccountNumber: true,
        payoutAccountType: true,
        payoutHolderName: true,
        payoutDocumentType: true,
        payoutDocumentNumber: true,
      },
    },
  },
  {
    id: true,
    price: true,
    status: true,
    progress: true,
    trackingNumber: true,
    createdAt: true,
    updatedAt: true,
    buyerId: true,
    sellerId: true,
    gigId: true,
    customFields: true,
    serviceLatitude: true,
    serviceLongitude: true,
    serviceAddress: true,
    gig: { select: { title: true, imageUrl: true } },
    buyer: { select: { id: true, name: true, email: true } },
    seller: { select: { id: true, name: true, businessName: true, referredById: true } },
  },
  {
    id: true,
    price: true,
    status: true,
    progress: true,
    trackingNumber: true,
    createdAt: true,
    updatedAt: true,
    buyerId: true,
    sellerId: true,
    gigId: true,
    customFields: true,
    gig: { select: { title: true, imageUrl: true } },
    buyer: { select: { id: true, name: true, email: true } },
    seller: { select: { id: true, name: true, businessName: true } },
  },
]

function enrichOrderListRow(
  row: Record<string, unknown>,
  tierIndex: number
): OrderListRow {
  const status = typeof row.status === 'string' ? prismaStatusToLabel(row.status) : OrderStatusLabel.Pending
  const base = row as unknown as OrderListRow
  return {
    ...base,
    status,
    sellerPayoutAt: tierIndex === 0 ? (base.sellerPayoutAt ?? null) : null,
    wompiPayoutRef: tierIndex === 0 ? (base.wompiPayoutRef ?? null) : null,
    serviceLatitude: tierIndex <= 1 ? (base.serviceLatitude ?? null) : null,
    serviceLongitude: tierIndex <= 1 ? (base.serviceLongitude ?? null) : null,
    serviceAddress: tierIndex <= 1 ? (base.serviceAddress ?? null) : null,
  }
}

export async function fetchOrdersList(where: Prisma.OrderWhereInput): Promise<OrderListRow[]> {
  let lastError: unknown

  for (let i = 0; i < orderListSelectTiers.length; i++) {
    const select = orderListSelectTiers[i]
    try {
      const rows = await prisma.order.findMany({
        where,
        select,
        orderBy: { createdAt: 'desc' },
      })
      return rows.map((row: Record<string, unknown>) => enrichOrderListRow(row, i))
    } catch (e: unknown) {
      if (!isMissingColumnError(e)) throw e
      lastError = e
    }
  }

  throw lastError ?? new Error('Failed to fetch orders')
}

type SessionUser = {
  id?: string
  name?: string | null
  email?: string | null
}

/** Ensure JWT session user exists in DB before order FK insert. */
export async function ensureBuyerForOrder(user: SessionUser | undefined): Promise<void> {
  const userId = user?.id
  if (!userId) return

  const email = user?.email?.trim()
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      name: user?.name || 'Comprador',
      ...(email ? { email } : {}),
      role: 'buyer',
    },
  })
}

export async function createPendingOrder({
  buyerId,
  sellerId,
  gigId,
  price,
}: {
  buyerId: string
  sellerId: string
  gigId: string
  price: number
}) {
  return prisma.order.create({
    data: {
      buyerId,
      sellerId,
      gigId,
      price,
      status: labelToPrismaStatus(OrderStatusLabel.Pending),
      customFields: null,
    },
    select: orderCreateSelect,
  })
}