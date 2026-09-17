import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifications } from '@/lib/notifications'
import { parseCustomFields } from '@/lib/utils'
import {
  normalizeOrderStatus,
  OrderStatusLabel,
} from '@/lib/order-status'

const DEFAULT_DELIVERY_FEE = 8000

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
    }

    const { id: orderId } = await params
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        buyerId: true,
        sellerId: true,
        customFields: true,
        serviceAddress: true,
        gig: { select: { title: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }
    if (order.sellerId !== userId) {
      return NextResponse.json({ error: 'Solo el vendedor puede agregar domicilio' }, { status: 403 })
    }

    const status = normalizeOrderStatus(order.status)
    if (
      status !== OrderStatusLabel.Paid &&
      status !== OrderStatusLabel.InProgress
    ) {
      return NextResponse.json(
        { error: 'El domicilio se agrega después del pago, en pedidos pagados o en progreso' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const feeRaw = Number(body.fee)
    const fee = Number.isFinite(feeRaw) && feeRaw >= 0 ? Math.round(feeRaw) : DEFAULT_DELIVERY_FEE
    const address = String(body.address || '').trim()
    const note = String(body.note || '').trim()

    const fields = parseCustomFields(order.customFields)
    if (fields.entregaDomicilio === true || fields.entregaDomicilio === 'Sí') {
      return NextResponse.json({ error: 'Este pedido ya tiene domicilio' }, { status: 409 })
    }

    const nextFields = {
      ...fields,
      entregaDomicilio: 'Sí',
      costoDomicilio: fee,
      ...(address ? { direccionEntrega: address } : {}),
      ...(note ? { notaDomicilio: note } : {}),
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        customFields: JSON.stringify(nextFields),
        ...(address ? { serviceAddress: address } : {}),
      },
      select: {
        id: true,
        customFields: true,
        serviceAddress: true,
        status: true,
      },
    })

    const feeLabel = fee > 0 ? `$${fee.toLocaleString('es-CO')} COP` : 'sin costo extra'
    const chatLines = [
      `Domicilio agregado a este pedido (${feeLabel}).`,
      address ? `Dirección: ${address}.` : null,
      note || null,
      'El valor ya pagado del pedido no cambia. Coordinen el domicilio por este chat.',
    ].filter(Boolean)

    try {
      await prisma.orderMessage.create({
        data: {
          orderId,
          content: chatLines.join(' '),
          isFromBuyer: false,
        },
      })
    } catch {
      // chat is best-effort
    }

    try {
      await notifications.sendInApp(
        order.buyerId,
        'order',
        'El vendedor agregó domicilio',
        `Tu pedido "${order.gig.title}" ahora incluye entrega a domicilio (${feeLabel}).`,
        `/orders/${orderId}`,
        { orderId, gigTitle: order.gig.title, deliveryFee: fee }
      )
    } catch {
      // notification is best-effort
    }

    return NextResponse.json({
      success: true,
      order: updated,
      delivery: { fee, address: address || null, note: note || null },
    })
  } catch (error) {
    console.error('Add delivery error:', error)
    return NextResponse.json({ error: 'No se pudo agregar el domicilio' }, { status: 500 })
  }
}
