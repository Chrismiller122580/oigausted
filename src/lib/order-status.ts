/** API / UI string values (backward compatible). */
export const OrderStatusLabel = {
  Pending: 'Pending',
  Paid: 'Paid',
  InProgress: 'In Progress',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
} as const

export type OrderStatusLabelValue = (typeof OrderStatusLabel)[keyof typeof OrderStatusLabel]

/** Prisma enum members (Postgres). SQLite dev stores label strings directly. */
export type PrismaOrderStatusValue = 'Pending' | 'Paid' | 'InProgress' | 'Completed' | 'Cancelled'

export const VALID_ORDER_STATUS_LABELS: OrderStatusLabelValue[] = [
  OrderStatusLabel.Pending,
  OrderStatusLabel.Paid,
  OrderStatusLabel.InProgress,
  OrderStatusLabel.Completed,
  OrderStatusLabel.Cancelled,
]

import { isSqliteDatabase } from '@/lib/utils'

export function isOrderStatusLabel(s: string): s is OrderStatusLabelValue {
  return (VALID_ORDER_STATUS_LABELS as string[]).includes(s)
}

/** Convert API label to value stored via Prisma (enum on Postgres, string on SQLite). */
export function labelToPrismaStatus(label: OrderStatusLabelValue): PrismaOrderStatusValue | OrderStatusLabelValue {
  if (label === OrderStatusLabel.InProgress) {
    return isSqliteDatabase() ? OrderStatusLabel.InProgress : 'InProgress'
  }
  return label
}

export function prismaStatusToLabel(status: PrismaOrderStatusValue | OrderStatusLabelValue | string): OrderStatusLabelValue {
  if (status === 'InProgress' || status === OrderStatusLabel.InProgress) return OrderStatusLabel.InProgress
  if (isOrderStatusLabel(status)) return status
  return OrderStatusLabel.Pending
}

/** Normalize status from DB for comparisons in transition rules. */
export function normalizeOrderStatus(status: string): PrismaOrderStatusValue | OrderStatusLabelValue {
  if (status === OrderStatusLabel.InProgress) return 'InProgress'
  return status as PrismaOrderStatusValue
}