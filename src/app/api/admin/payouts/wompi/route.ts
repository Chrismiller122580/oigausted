import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireFinancePanelSession } from '@/lib/admin-auth'
import { logAuditEvent } from '@/lib/audit'
import { calculateOrderPayout, DEFAULT_PAYOUT_CONFIG } from '@/lib/payout'
import { getPlatformConfig } from '@/lib/prisma'
import {
  getWompiPayoutsConfig,
  listWompiBanks,
  matchBankId,
  createWompiPayout,
} from '@/lib/wompi-payouts'
import { devLog } from '@/lib/utils'
import { sendNotification } from '@/lib/notifications'
import { notifyAdminsSellerPayout } from '@/lib/admin-notifications'
import { sellerPayoutSentEmail } from '@/lib/emails/templates'
import { sendWhatsApp, sendAdminWhatsApp } from '@/lib/whatsapp'

export async function POST(req: Request) {
  const session = await requireFinancePanelSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const cfg = getWompiPayoutsConfig()
  if (!cfg) {
    return NextResponse.json(
      { error: 'Wompi Pagos a Terceros no está configurado. Faltan WOMPI_PAYOUTS_API_KEY, WOMPI_PAYOUTS_USER_ID o WOMPI_PAYOUTS_ACCOUNT_ID.' },
      { status: 503 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : ''
  if (!orderId) {
    return NextResponse.json({ error: 'Falta el pedido' }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      price: true,
      status: true,
      sellerPayoutAt: true,
      sellerId: true,
      gig: { select: { title: true } },
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          whatsapp: true,
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
  })

  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  if (order.status !== 'Completed') {
    return NextResponse.json({ error: 'Solo se pagan pedidos completados' }, { status: 400 })
  }
  if (order.sellerPayoutAt) {
    return NextResponse.json({ error: 'Este pedido ya fue marcado como pagado' }, { status: 400 })
  }

  const s = order.seller
  if (!s?.payoutAccountNumber || !s.payoutHolderName || !s.payoutDocumentNumber || !s.payoutBankCode) {
    return NextResponse.json({ error: 'El vendedor no tiene datos bancarios completos' }, { status: 400 })
  }

  const config = await getPlatformConfig().catch(() => null)
  const rates = {
    platformCommissionRate: config?.commissionRate ?? DEFAULT_PAYOUT_CONFIG.platformCommissionRate,
    referralCommissionRate: config?.referralCommissionRate ?? DEFAULT_PAYOUT_CONFIG.referralCommissionRate,
  }
  const breakdown = calculateOrderPayout(order.price, !!s.referredById, rates)
  const amountCents = Math.round(breakdown.netToSeller * 100)
  if (amountCents <= 0) {
    return NextResponse.json({ error: 'El monto neto es cero' }, { status: 400 })
  }

  let banks
  try {
    banks = await listWompiBanks(cfg)
  } catch (e) {
    devLog('[wompi-payout] banks lookup failed', e)
    return NextResponse.json({ error: 'No se pudo consultar bancos de Wompi' }, { status: 502 })
  }

  const bankId = matchBankId(banks, s.payoutBankCode)
  if (!bankId) {
    return NextResponse.json(
      { error: `No se encontró el banco "${s.payoutBankCode}" en Wompi. Revisa el código.` },
      { status: 400 }
    )
  }

  const acctType = (s.payoutAccountType || '').toUpperCase()
  const accountType: 'AHORROS' | 'CORRIENTE' =
    acctType === 'CHECKING' || acctType === 'CORRIENTE' ? 'CORRIENTE' : 'AHORROS'

  const docType = (s.payoutDocumentType || 'CC').toUpperCase()
  const legalIdType = ['CC', 'NIT', 'CE', 'TI', 'PP'].includes(docType) ? docType : 'CC'
  const personType = legalIdType === 'NIT' ? 'JURIDICA' : 'NATURAL'

  try {
    const result = await createWompiPayout(cfg, {
      reference: `og-${order.id}`,
      amountCents,
      name: s.payoutHolderName,
      email: s.email,
      legalIdType,
      legalId: s.payoutDocumentNumber.replace(/\D/g, '') || s.payoutDocumentNumber,
      bankId,
      accountType,
      accountNumber: s.payoutAccountNumber.replace(/\D/g, '') || s.payoutAccountNumber,
      personType,
    })

    await prisma.order.update({
      where: { id: order.id },
      data: { wompiPayoutRef: result.payoutId || result.reference },
    })

    await logAuditEvent({
      performedById: session.user.id,
      action: 'WOMPI_PAYOUT_CREATED',
      targetType: 'Order',
      targetId: order.id,
      details: { payoutId: result.payoutId, amountCents, bankId },
    }).catch(() => {})

    const amountCOP = amountCents / 100
    const last4 = (s.payoutAccountNumber || '').replace(/\D/g, '').slice(-4)
    const email = sellerPayoutSentEmail({
      userName: s.payoutHolderName || s.name,
      gigTitle: order.gig?.title || 'tu servicio',
      amount: amountCOP,
      orderId: order.id,
      bankCode: s.payoutBankCode,
      accountLast4: last4,
    })

    await sendNotification({
      userId: s.id,
      category: 'payment',
      type: 'email',
      title: email.subject,
      message: `Enviamos $${amountCOP.toLocaleString('es-CO')} COP a tu cuenta ${s.payoutBankCode || ''}. Se está procesando.`,
      link: '/seller/earnings',
      data: { orderId: order.id, payoutId: result.payoutId },
    }).catch((e) => devLog('[wompi-payout] seller notify failed', e))

    const waTo = s.whatsapp || s.phone;
    if (waTo) {
      await sendWhatsApp(
        waTo,
        `OigaGIG: enviamos $${amountCOP.toLocaleString('es-CO')} COP a tu ${s.payoutBankCode || 'cuenta'} por "${order.gig?.title || 'tu servicio'}". Se está procesando.`,
      ).catch(() => {});
    }
    await sendAdminWhatsApp(
      `Pago enviado: $${amountCOP.toLocaleString('es-CO')} a ${s.payoutHolderName || s.name} por "${order.gig?.title || 'servicio'}". Pedido ${order.id}.`,
    ).catch(() => {});

    await notifyAdminsSellerPayout({
      sellerName: s.payoutHolderName || s.name || s.email,
      gigTitle: order.gig?.title || 'servicio',
      amount: amountCOP,
      orderId: order.id,
      payoutId: result.payoutId,
    }).catch((e) => devLog('[wompi-payout] admin notify failed', e))

    return NextResponse.json({
      success: true,
      payoutId: result.payoutId,
      reference: result.reference,
      amountCents,
      note: 'Pago enviado a Wompi. Se marcará como pagado cuando Wompi confirme.',
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al crear el pago en Wompi'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
