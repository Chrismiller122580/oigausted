import { prisma } from '@/lib/prisma'
import { logAuditEvent } from '@/lib/audit'
import { notifications } from '@/lib/notifications'
import { devLog } from '@/lib/utils'

type WompiTx = {
  id: string
  status?: string
  reference?: string
  amount_in_cents?: number
  payment_method_type?: string
  created_at?: string
  [key: string]: unknown
}

export type WompiRefundResult = {
  attempted: boolean
  success: boolean
  method?: 'void' | 'refund' | 'already_voided'
  transactionId?: string | null
  wompiStatus?: string | null
  message: string
}

function wompiBase(): string {
  const pub = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || ''
  return /test|sandbox|_test_/i.test(pub) ? 'https://sandbox.wompi.co' : 'https://production.wompi.co'
}

function authToken(): string {
  return process.env.WOMPI_PRIVATE_KEY || process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || ''
}

async function findTransaction(orderId: string): Promise<WompiTx | null> {
  const token = authToken()
  if (!token) return null
  const reference = `order_${orderId}`
  const res = await fetch(`${wompiBase()}/v1/transactions?reference=${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const data = await res.json().catch(() => null)
  const list: WompiTx[] = Array.isArray(data?.data) ? data.data : []
  const approved = list.filter((tx) => String(tx.status || '').toUpperCase() === 'APPROVED')
  const pool = approved.length ? approved : list
  pool.sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0
    return tb - ta
  })
  return pool[0] || null
}

async function postWompi(path: string): Promise<{ ok: boolean; status: number; body: Record<string, unknown> }> {
  const token = authToken()
  const res = await fetch(`${wompiBase()}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  })
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
  return { ok: res.ok, status: res.status, body }
}

/** Best-effort Wompi return of funds after an admin cancel. */
export async function refundWompiForOrder(
  orderId: string,
  performedById?: string | null
): Promise<WompiRefundResult> {
  const token = authToken()
  if (!token || !process.env.WOMPI_PRIVATE_KEY) {
    return {
      attempted: false,
      success: false,
      message: 'Falta WOMPI_PRIVATE_KEY para anular o devolver el pago.',
    }
  }

  let tx: WompiTx | null = null
  try {
    tx = await findTransaction(orderId)
  } catch (e) {
    devLog('[Wompi refund] lookup failed', e)
  }

  if (!tx?.id) {
    return {
      attempted: true,
      success: false,
      transactionId: null,
      message: 'No hay una transacción Wompi aprobada para este pedido.',
    }
  }

  const current = String(tx.status || '').toUpperCase()
  if (current === 'VOIDED' || current === 'REFUNDED') {
    return {
      attempted: true,
      success: true,
      method: 'already_voided',
      transactionId: tx.id,
      wompiStatus: current,
      message: 'Wompi ya tenía esta transacción anulada o reembolsada.',
    }
  }

  if (current && current !== 'APPROVED') {
    return {
      attempted: true,
      success: false,
      transactionId: tx.id,
      wompiStatus: current,
      message: `Wompi está en ${current}; no se puede devolver automáticamente.`,
    }
  }

  const voidRes = await postWompi(`/v1/transactions/${encodeURIComponent(tx.id)}/void`)
  const voidStatus = String((voidRes.body?.data as { status?: string } | undefined)?.status || '').toUpperCase()
  if (voidRes.ok || voidStatus === 'VOIDED') {
    await logAuditEvent({
      performedById: performedById || undefined,
      action: 'WOMPI_VOIDED',
      targetType: 'Order',
      targetId: orderId,
      details: { wompiTransactionId: tx.id, via: 'void' },
    }).catch(() => {})
    return {
      attempted: true,
      success: true,
      method: 'void',
      transactionId: tx.id,
      wompiStatus: voidStatus || 'VOIDED',
      message: 'Pago anulado en Wompi. El dinero vuelve al medio de pago (tarjeta, mismo día).',
    }
  }

  const refundRes = await postWompi(`/v1/transactions/${encodeURIComponent(tx.id)}/refund`)
  const refundStatus = String((refundRes.body?.data as { status?: string } | undefined)?.status || '').toUpperCase()
  if (refundRes.ok || refundStatus === 'REFUNDED' || refundStatus === 'VOIDED') {
    await logAuditEvent({
      performedById: performedById || undefined,
      action: 'WOMPI_REFUNDED',
      targetType: 'Order',
      targetId: orderId,
      details: { wompiTransactionId: tx.id, via: 'refund' },
    }).catch(() => {})
    return {
      attempted: true,
      success: true,
      method: 'refund',
      transactionId: tx.id,
      wompiStatus: refundStatus || 'REFUNDED',
      message: 'Reembolso solicitado en Wompi.',
    }
  }

  const errText =
    (typeof refundRes.body?.error === 'string' && refundRes.body.error) ||
    (typeof voidRes.body?.error === 'string' && voidRes.body.error) ||
    'Wompi no permitió anular ni reembolsar por API (Nequi/PSE o cargo ya liquidado).'

  devLog('[Wompi refund] both paths failed', { orderId, tx: tx.id, voidRes, refundRes })
  return {
    attempted: true,
    success: false,
    transactionId: tx.id,
    wompiStatus: current,
    message: String(errText),
  }
}

export async function notifyBuyerRefundResult(
  orderId: string,
  result: WompiRefundResult
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      buyerId: true,
      price: true,
      gig: { select: { title: true } },
    },
  })
  if (!order?.buyerId) return
  const title = result.success ? 'Reembolso en proceso' : 'Pedido cancelado — reembolso pendiente'
  const message = result.success
    ? `Cancelamos "${order.gig?.title || 'tu pedido'}" y pedimos a Wompi devolver $${Number(order.price || 0).toLocaleString('es-CO')}.`
    : `Cancelamos "${order.gig?.title || 'tu pedido'}". El reembolso hay que completarlos en Wompi: ${result.message}`
  await notifications.sendInApp(order.buyerId, 'payment', title, message, `/orders/${orderId}`, {
    orderId,
    refund: result.success,
    amount: order.price,
  }).catch(() => {})
}
