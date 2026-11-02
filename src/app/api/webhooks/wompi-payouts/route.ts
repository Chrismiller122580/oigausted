import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAuditEvent } from '@/lib/audit'
import { devLog } from '@/lib/utils'
import { sendNotification } from '@/lib/notifications'
import { notifyAdminsSellerPayout } from '@/lib/admin-notifications'
import { sellerPayoutConfirmedEmail } from '@/lib/emails/templates'
import { calculateOrderPayout, DEFAULT_PAYOUT_CONFIG } from '@/lib/payout'
import { getPlatformConfig } from '@/lib/prisma'

/**
 * Wompi Pagos a Terceros webhook.
 * Expects payout.updated or transaction.updated.
 * Marks the order paid when status is TOTAL_PAYMENT / APPROVED.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const event = body?.event || body?.type
    const data = body?.data || body

    const payout = data?.payout || data
    const transaction = data?.transaction
    const status = (payout?.status || transaction?.status || '').toUpperCase()
    const ref = payout?.reference || transaction?.reference || payout?.id || transaction?.payoutId

    if (!ref) {
      return NextResponse.json({ ok: true, ignored: true })
    }

    // Our references are og-{orderId}
    const orderId = String(ref).startsWith('og-') ? String(ref).slice(3) : null
    if (!orderId) {
      return NextResponse.json({ ok: true, ignored: true })
    }

    const success = ['TOTAL_PAYMENT', 'APPROVED', 'PAID'].includes(status)
    if (!success) {
      devLog('[wompi-payouts webhook] non-success', { event, status, orderId })
      return NextResponse.json({ ok: true, status })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, sellerPayoutAt: true },
    })
    if (!order || order.sellerPayoutAt) {
      return NextResponse.json({ ok: true, already: true })
    }

    const full = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        price: true,
        gig: { select: { title: true } },
        seller: { select: { id: true, name: true, email: true, payoutHolderName: true, referredById: true } },
      },
    })

    await prisma.order.update({
      where: { id: orderId },
      data: {
        sellerPayoutAt: new Date(),
        wompiPayoutRef: payout?.id || transaction?.payoutId || ref,
      },
    })

    if (full?.seller) {
      const config = await getPlatformConfig().catch(() => null)
      const rates = {
        platformCommissionRate: config?.commissionRate ?? DEFAULT_PAYOUT_CONFIG.platformCommissionRate,
        referralCommissionRate: config?.referralCommissionRate ?? DEFAULT_PAYOUT_CONFIG.referralCommissionRate,
      }
      const amount = calculateOrderPayout(full.price, !!full.seller.referredById, rates).netToSeller
      const email = sellerPayoutConfirmedEmail({
        userName: full.seller.payoutHolderName || full.seller.name,
        gigTitle: full.gig?.title || 'tu servicio',
        amount,
        orderId: full.id,
      })
      await sendNotification({
        userId: full.seller.id,
        category: 'payment',
        type: 'email',
        title: email.subject,
        message: `Wompi confirmó tu pago de $${amount.toLocaleString('es-CO')} COP.`,
        link: '/seller/earnings',
        data: { orderId: full.id },
      }).catch(() => {})
      await notifyAdminsSellerPayout({
        sellerName: full.seller.payoutHolderName || full.seller.name || full.seller.email,
        gigTitle: full.gig?.title || 'servicio',
        amount,
        orderId: full.id,
        payoutId: payout?.id || transaction?.payoutId,
      }).catch(() => {})
    }

    await logAuditEvent({
      performedById: null,
      action: 'WOMPI_PAYOUT_CONFIRMED',
      targetType: 'Order',
      targetId: orderId,
      details: { event, status, payoutId: payout?.id },
    }).catch(() => {})

    return NextResponse.json({ ok: true, marked: orderId })
  } catch (e) {
    devLog('[wompi-payouts webhook] error', e)
    return NextResponse.json({ error: 'webhook error' }, { status: 500 })
  }
}
