import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireFinancePanelSession } from '@/lib/admin-auth'
import { missingSellerPayoutBankFields } from '@/lib/seller-payout-bank'
import { logAuditEvent } from '@/lib/audit'

export async function POST(req: Request) {
  const session = await requireFinancePanelSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
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
      sellerId: true,
      sellerPayoutAt: true,
      seller: {
        select: {
          payoutBankCode: true,
          payoutAccountNumber: true,
          payoutHolderName: true,
          payoutDocumentNumber: true,
        },
      },
    },
  })

  if (!order) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  }

  const missing = missingSellerPayoutBankFields(order.seller || {})
  // Allow if only bank code is missing and the other three are present (default to NEQUI for 3xx numbers)
  const onlyBankCodeMissing = missing.length === 1 && missing[0] === 'payoutBankCode'
  if (missing.length > 0 && !onlyBankCodeMissing) {
    return NextResponse.json(
      {
        error: 'No se puede pagar: el vendedor no tiene la cuenta bancaria completa.',
        missingFields: missing,
      },
      { status: 400 }
    )
  }
  if (onlyBankCodeMissing) {
    const acct = String(order.seller?.payoutAccountNumber || '').replace(/\D/g, '')
    await prisma.user.update({
      where: { id: order.sellerId },
      data: {
        payoutBankCode: /^3\d{9}$/.test(acct) ? 'NEQUI' : 'BANCOLOMBIA',
        payoutAccountType: /^3\d{9}$/.test(acct) ? 'NEQUI' : 'SAVINGS',
      },
    }).catch(() => {})
  }

  const wompiPayoutRef =
    typeof body.wompiPayoutRef === 'string' && body.wompiPayoutRef.trim()
      ? body.wompiPayoutRef.trim()
      : undefined

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      sellerPayoutAt: new Date(),
      ...(wompiPayoutRef ? { wompiPayoutRef } : {}),
    },
    select: { id: true, sellerPayoutAt: true, wompiPayoutRef: true },
  })

  await logAuditEvent({
    performedById: session.user.id,
    action: 'SELLER_PAYOUT_MARKED',
    targetType: 'Order',
    targetId: orderId,
    details: {
      wompiPayoutRef: updated.wompiPayoutRef,
      bankRequired: true,
    },
  }).catch(() => {})

  return NextResponse.json({ success: true, order: updated })
}
