import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireFinancePanelSession } from '@/lib/admin-auth'
import { getWompiPayoutsConfig, getWompiPayoutByReference, isPayoutSuccess } from '@/lib/wompi-payouts'
import { sendNotification } from '@/lib/notifications'
import { notifyAdminsSellerPayout } from '@/lib/admin-notifications'
import { sellerPayoutConfirmedEmail } from '@/lib/emails/templates'
import { calculateOrderPayout, DEFAULT_PAYOUT_CONFIG } from '@/lib/payout'
import { getPlatformConfig } from '@/lib/prisma'
import { devLog } from '@/lib/utils'

/** Check submitted Wompi payouts and mark paid when Wompi confirms. */
export async function POST() {
  const session = await requireFinancePanelSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const cfg = getWompiPayoutsConfig()
  if (!cfg) return NextResponse.json({ error: 'Wompi payouts no configurado' }, { status: 503 })

  const pending = await prisma.order.findMany({
    where: { status: 'Completed', sellerPayoutAt: null, wompiPayoutRef: { not: null } },
    select: {
      id: true,
      price: true,
      wompiPayoutRef: true,
      gig: { select: { title: true } },
      seller: { select: { id: true, name: true, email: true, payoutHolderName: true, referredById: true } },
    },
  })

  let marked = 0
  for (const order of pending) {
    const ref = order.wompiPayoutRef || `og-${order.id}`
    const lookupRef = ref.startsWith('og-') ? ref : `og-${order.id}`
    try {
      const result = await getWompiPayoutByReference(cfg, lookupRef)
      if (!result || !isPayoutSuccess(result.status)) continue

      await prisma.order.update({
        where: { id: order.id },
        data: { sellerPayoutAt: new Date(), wompiPayoutRef: result.id || ref },
      })
      marked++

      if (order.seller) {
        const config = await getPlatformConfig().catch(() => null)
        const rates = {
          platformCommissionRate: config?.commissionRate ?? DEFAULT_PAYOUT_CONFIG.platformCommissionRate,
          referralCommissionRate: config?.referralCommissionRate ?? DEFAULT_PAYOUT_CONFIG.referralCommissionRate,
        }
        const amount = calculateOrderPayout(order.price, !!order.seller.referredById, rates).netToSeller
        const email = sellerPayoutConfirmedEmail({
          userName: order.seller.payoutHolderName || order.seller.name,
          gigTitle: order.gig?.title || 'tu servicio',
          amount,
          orderId: order.id,
        })
        await sendNotification({
          userId: order.seller.id,
          category: 'payment',
          type: 'email',
          title: email.subject,
          message: `Wompi confirmó tu pago de $${amount.toLocaleString('es-CO')} COP.`,
          link: '/seller/earnings',
        }).catch(() => {})
        await notifyAdminsSellerPayout({
          sellerName: order.seller.payoutHolderName || order.seller.name || order.seller.email,
          gigTitle: order.gig?.title || 'servicio',
          amount,
          orderId: order.id,
          payoutId: result.id,
        }).catch(() => {})
      }
    } catch (e) {
      devLog('[wompi-refresh]', order.id, e)
    }
  }

  return NextResponse.json({ checked: pending.length, marked })
}
