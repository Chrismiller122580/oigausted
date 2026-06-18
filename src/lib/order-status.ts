import type { OrderStatus } from '@prisma/client'
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

const POSTGRES_STATUS_MAP: Record<OrderStatusLabelValue, OrderStatus> = {
  [OrderStatusLabel.Pending]: 'Pending',
  [OrderStatusLabel.Paid]: 'Paid',
  [OrderStatusLabel.InProgress]: 'In_Progress',
  [OrderStatusLabel.Completed]: 'Completed',
  [OrderStatusLabel.Cancelled]: 'Cancelled',
}

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

/** Convert API label to Prisma Order.status (Postgres enum / SQLite TEXT). */
export function labelToPrismaStatus(label: OrderStatusLabelValue): OrderStatus {
  if (isSqliteDatabase()) {
    return label as unknown as OrderStatus
  }
  return POSTGRES_STATUS_MAP[label]
}

export function prismaStatusToLabel(status: OrderStatus | string): OrderStatusLabelValue {
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

/** Spanish labels for seller/buyer order UI. */
export const ORDER_STATUS_DISPLAY_ES: Record<OrderStatusLabelValue, string> = {
  [OrderStatusLabel.Pending]: 'Pendiente',
  [OrderStatusLabel.Paid]: 'Pagado',
  [OrderStatusLabel.InProgress]: 'En progreso',
  [OrderStatusLabel.Completed]: 'Completado',
  [OrderStatusLabel.Cancelled]: 'Cancelado',
}

export function getOrderStatusDisplayEs(status: string): string {
  return ORDER_STATUS_DISPLAY_ES[prismaStatusToLabel(status)] ?? status
}

export const SELLER_ORDER_FILTER_LABELS: Record<string, string> = {
  All: 'Todos',
  Pending: 'Pendiente',
  Paid: 'Pagado',
  'In Progress': 'En progreso',
  Completed: 'Completado',
}