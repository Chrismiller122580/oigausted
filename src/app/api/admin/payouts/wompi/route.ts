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
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
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
