import { OrderStatusLabel, prismaStatusToLabel, type OrderStatusLabelValue } from '@/lib/order-status'

export type OrderProgressStepKey =
  | 'created'
  | 'paid'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'approved'

export type OrderProgressStep = {
  key: OrderProgressStepKey
  label: string
  done: boolean
  current: boolean
  date: string | null
}

const STEP_LABELS: Record<OrderProgressStepKey, string> = {
  created: 'Pedido creado',
  paid: 'Pagado',
  accepted: 'Aceptado',
  in_progress: 'En progreso',
  completed: 'Trabajo completado',
  approved: 'Aprobado',
}

const STEP_KEYS: OrderProgressStepKey[] = [
  'created',
  'paid',
  'accepted',
  'in_progress',
  'completed',
  'approved',
]

function statusIndex(status: OrderStatusLabelValue): number {
  switch (status) {
    case OrderStatusLabel.Pending:
      return 0 // created done, waiting paid
    case OrderStatusLabel.Paid:
      return 1 // paid done, waiting accepted
    case OrderStatusLabel.InProgress:
      return 3 // through in_progress
    case OrderStatusLabel.Completed:
      return 4 // through completed
    case OrderStatusLabel.Cancelled:
      return -1
    default:
      return 0
  }
}

function stepLabel(key: OrderProgressStepKey, statusLabel: OrderStatusLabelValue): string {
  if (key === 'paid' && statusLabel === OrderStatusLabel.Pending) {
    return 'Esperando pago'
  }
  return STEP_LABELS[key]
}

export function getOrderProgressSteps({
  status,
  createdAt,
  updatedAt,
  hasReview = false,
}: {
  status: string
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
  hasReview?: boolean
}): OrderProgressStep[] {
  const label = prismaStatusToLabel(status)
  const idx = statusIndex(label)

  if (label === OrderStatusLabel.Cancelled) {
    return STEP_KEYS.map((key) => ({
      key,
      label: key === 'paid' ? 'Pago no completado' : STEP_LABELS[key],
      done: key === 'created',
      current: key === 'paid',
      date:
        key === 'created' && createdAt
          ? String(createdAt)
          : key === 'paid' && updatedAt
            ? String(updatedAt)
            : null,
    }))
  }

  const createdIso = createdAt ? new Date(createdAt).toISOString() : null
  const updatedIso = updatedAt ? new Date(updatedAt).toISOString() : null

  const doneForKey = (key: OrderProgressStepKey): boolean => {
    switch (key) {
      case 'created':
        return true
      case 'paid':
        return idx >= 1
      case 'accepted':
        return idx >= 3
      case 'in_progress':
        return idx >= 4
      case 'completed':
        return idx >= 4
      case 'approved':
        return idx >= 4 && hasReview
      default:
        return false
    }
  }

  let currentKey: OrderProgressStepKey | null = 'paid'
  if (idx <= 0) currentKey = 'paid'
  else if (idx === 1) currentKey = 'accepted'
  else if (idx === 3) currentKey = 'in_progress'
  else if (idx >= 4 && !hasReview) currentKey = 'approved'
  else currentKey = null

  return STEP_KEYS.map((key) => {
    const done = doneForKey(key)
    let date: string | null = null
    if (key === 'created' && createdIso) date = createdIso
    else if (done && key !== 'created' && updatedIso) date = updatedIso

    return {
      key,
      label: stepLabel(key, label),
      done,
      current: currentKey !== null && !done && key === currentKey,
      date,
    }
  })
}

/** 0–100 progress for list/card progress bars */
export function getOrderProgressPercent(status: string, hasReview = false): number {
  const steps = getOrderProgressSteps({ status, hasReview })
  const doneCount = steps.filter((s) => s.done).length
  const hasCurrent = steps.some((s) => s.current)
  const base = (doneCount / steps.length) * 100
  return hasCurrent ? Math.min(base + 100 / steps.length / 2, 99) : Math.min(base, 100)
}

export const ORDER_PROGRESS_MILESTONE_LABELS = [
  'Creado',
  'Pagado',
  'Aceptado',
  'En progreso',
  'Completado',
  'Aprobado',
] as const

/** Milestone labels for order list progress bar — reflects unpaid vs paid state. */
export function getOrderProgressMilestoneLabels(status: string): string[] {
  const label = prismaStatusToLabel(status)
  if (label === OrderStatusLabel.Pending) {
    return ['Creado', 'Esperando pago', 'Aceptado', 'En progreso', 'Completado', 'Aprobado']
  }
  if (label === OrderStatusLabel.Cancelled) {
    return ['Creado', 'Pago no completado', '—', '—', '—', '—']
  }
  return [...ORDER_PROGRESS_MILESTONE_LABELS]
}