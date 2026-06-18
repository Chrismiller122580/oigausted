import { isSqliteDatabase } from '@/lib/utils'

/** API / UI string values (backward compatible). */
export const OrderStatusLabel = {
  Pending: 'Pending',
  Paid: 'Paid',
  InProgress: 'In Progress',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
} as const

export type OrderStatusLabelValue = (typeof OrderStatusLabel)[keyof typeof OrderStatusLabel]

/**
 * Value passed to Prisma for Order.status.
 * Postgres: OrderStatus enum members (In_Progress maps to DB "In Progress").
 * SQLite dev: spaced API label strings stored as TEXT.
 */
export type PrismaOrderStatusValue =
  | 'Pending'
  | 'Paid'
  | 'In_Progress'
  | 'Completed'
  | 'Cancelled'
  | OrderStatusLabelValue

export const VALID_ORDER_STATUS_LABELS: OrderStatusLabelValue[] = [
  OrderStatusLabel.Pending,
  OrderStatusLabel.Paid,
  OrderStatusLabel.InProgress,
  OrderStatusLabel.Completed,
  OrderStatusLabel.Cancelled,
]

export function isOrderStatusLabel(s: string): s is OrderStatusLabelValue {
  return (VALID_ORDER_STATUS_LABELS as string[]).includes(s)
}

/** Convert API label to value for Prisma Order.status writes/filters. */
export function labelToPrismaStatus(label: OrderStatusLabelValue): PrismaOrderStatusValue {
  if (isSqliteDatabase()) return label
  switch (label) {
    case OrderStatusLabel.Pending:
      return 'Pending'
    case OrderStatusLabel.Paid:
      return 'Paid'
    case OrderStatusLabel.InProgress:
      return 'In_Progress'
    case OrderStatusLabel.Completed:
      return 'Completed'
    case OrderStatusLabel.Cancelled:
      return 'Cancelled'
    default:
      return 'Pending'
  }
}

export function prismaStatusToLabel(status: PrismaOrderStatusValue | string): OrderStatusLabelValue {
  if (
    status === 'In_Progress' ||
    status === 'InProgress' ||
    status === OrderStatusLabel.InProgress
  ) {
    return OrderStatusLabel.InProgress
  }
  if (isOrderStatusLabel(status)) return status
  return OrderStatusLabel.Pending
}

/** Normalize status from DB for comparisons in transition rules. */
export function normalizeOrderStatus(status: string): OrderStatusLabelValue {
  return prismaStatusToLabel(status)
}