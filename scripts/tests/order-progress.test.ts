import {
  getOrderProgressPercent,
  getOrderProgressSteps,
  getOrderProgressMilestoneLabels,
} from '../../src/lib/order-progress'
import { OrderStatusLabel } from '../../src/lib/order-status'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const pending = getOrderProgressSteps({ status: OrderStatusLabel.Pending, createdAt: '2026-06-17' })
assert(pending.find((s) => s.key === 'created')?.done === true, 'created done')
const pendingPaidStep = pending.find((s) => s.key === 'paid')
assert(pendingPaidStep?.current === true, 'paid step is current when pending')
assert(pendingPaidStep?.label === 'Esperando pago', 'pending shows Esperando pago not Pagado')
assert(getOrderProgressMilestoneLabels(OrderStatusLabel.Pending)[1] === 'Esperando pago', 'milestone labels for pending')

const paid = getOrderProgressSteps({ status: OrderStatusLabel.Paid })
assert(paid.find((s) => s.key === 'paid')?.done === true, 'paid done')
assert(paid.find((s) => s.key === 'paid')?.label === 'Pagado', 'paid step label when paid')
assert(paid.find((s) => s.key === 'accepted')?.current === true, 'accepted current when paid')

const inProg = getOrderProgressSteps({ status: OrderStatusLabel.InProgress })
assert(inProg.find((s) => s.key === 'accepted')?.done === true, 'accepted done when in progress')
assert(inProg.find((s) => s.key === 'in_progress')?.current === true, 'in progress current')

const cancelled = getOrderProgressSteps({ status: OrderStatusLabel.Cancelled, createdAt: '2026-06-17' })
assert(cancelled.some((s) => s.label === 'Pago no completado' && s.current), 'cancelled shows payment failed step')

const done = getOrderProgressSteps({ status: OrderStatusLabel.Completed, hasReview: true })
assert(done.every((s) => s.done), 'all steps done when completed + reviewed')
assert(getOrderProgressPercent(OrderStatusLabel.Completed, true) === 100, '100% when approved')

console.log('order-progress.test.ts OK')