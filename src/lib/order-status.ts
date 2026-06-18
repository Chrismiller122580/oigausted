/** API / UI string values (backward compatible). */
export const OrderStatusLabel = {
  Pending: 'Pending',
  Paid: 'Paid',
  InProgress: 'In Progress',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
} as const

export type OrderStatusLabelValue = (typeof OrderStatusLabel)[keyof typeof OrderStatusLabel]

/** Values stored in DB (Postgres enum uses spaced labels; SQLite uses the same API labels). */
export type PrismaOrderStatusValue = OrderStatusLabelValue | 'InProgress'

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

/** Convert API label to value stored via Prisma (Postgres OrderStatus enum matches API labels). */
export function labelToPrismaStatus(label: OrderStatusLabelValue): OrderStatusLabelValue {
  return label
}

export function prismaStatusToLabel(status: PrismaOrderStatusValue | OrderStatusLabelValue | string): OrderStatusLabelValue {
  if (status === 'InProgress' || status === OrderStatusLabel.InProgress) return OrderStatusLabel.InProgress
  if (isOrderStatusLabel(status)) return status
  return OrderStatusLabel.Pending
}

/** Normalize status from DB for comparisons in transition rules. */
export function normalizeOrderStatus(status: string): OrderStatusLabelValue {
  if (status === 'InProgress' || status === OrderStatusLabel.InProgress) {
    return OrderStatusLabel.InProgress
  }
  if (isOrderStatusLabel(status)) return status
  return OrderStatusLabel.Pending
}