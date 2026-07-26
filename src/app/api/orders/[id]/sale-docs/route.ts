import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  buildSaleDocsContext,
  orderIncludesSaleDocsBundle,
  renderSaleDoc,
  saleDocFilename,
  type VehicleSaleDocKind,
} from '@/lib/vehicle-sale-docs'
import { OrderStatusLabel, prismaStatusToLabel } from '@/lib/order-status'

/**
 * GET /api/orders/[id]/sale-docs?doc=contract|checklist
 * Download city-aware vehicle sale documents for orders that purchased the pack.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
    }

    const { id: orderId } = await params
    const docParam = (request.nextUrl.searchParams.get('doc') || 'contract').toLowerCase()
    const kind: VehicleSaleDocKind = docParam === 'checklist' ? 'checklist' : 'contract'

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        price: true,
        status: true,
        customFields: true,
        createdAt: true,
        buyerId: true,
        sellerId: true,
        buyer: { select: { name: true } },
        seller: { select: { name: true, businessName: true, city: true } },
        gig: {
          select: {
            title: true,
            city: true,
            addons: true,
            fields: true,
            category: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    const isParty = userId === order.buyerId || userId === order.sellerId
    const isAdmin = session?.user?.role === 'admin'
    if (!isParty && !isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (!orderIncludesSaleDocsBundle(order.customFields)) {
      return NextResponse.json(
        { error: 'Este pedido no incluye el paquete de documentos OigaGIG' },
        { status: 400 },
      )
    }

    const statusLabel = prismaStatusToLabel(order.status)
    const paidOk =
      statusLabel === OrderStatusLabel.Paid ||
      statusLabel === OrderStatusLabel.InProgress ||
      statusLabel === OrderStatusLabel.Completed
    if (!paidOk && !isAdmin) {
      return NextResponse.json(
        { error: 'Los documentos están disponibles después del pago' },
        { status: 400 },
      )
    }

    const ctx = buildSaleDocsContext({
      orderId: order.id,
      orderPrice: order.price,
      createdAt: order.createdAt,
      customFields: order.customFields,
      gigTitle: order.gig?.title,
      gigCity: order.gig?.city,
      sellerName: order.seller?.businessName || order.seller?.name,
      sellerCity: order.seller?.city,
      buyerName: order.buyer?.name,
      addons: order.gig?.addons,
      gigFields: order.gig?.fields,
    })

    const html = renderSaleDoc(kind, ctx)
    const filename = saleDocFilename(kind, order.id)

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error: unknown) {
    console.error('[sale-docs] GET failed', error)
    return NextResponse.json({ error: 'No se pudo generar el documento' }, { status: 500 })
  }
}

/** Lightweight status for order UI. */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
        customFields: true,
        buyerId: true,
        sellerId: true,
        gig: { select: { addons: true, city: true } },
        seller: { select: { city: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    if (userId !== order.buyerId && userId !== order.sellerId && session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const included = orderIncludesSaleDocsBundle(order.customFields)
    const statusLabel = prismaStatusToLabel(order.status)
    const available =
      included &&
      (statusLabel === OrderStatusLabel.Paid ||
        statusLabel === OrderStatusLabel.InProgress ||
        statusLabel === OrderStatusLabel.Completed)

    return NextResponse.json({
      included,
      available,
      status: statusLabel,
      docs: available
        ? [
            { kind: 'contract', label: 'Contrato de compraventa', url: `/api/orders/${orderId}/sale-docs?doc=contract` },
            { kind: 'checklist', label: 'Checklist de papeles', url: `/api/orders/${orderId}/sale-docs?doc=checklist` },
          ]
        : [],
    })
  } catch (error: unknown) {
    console.error('[sale-docs] POST status failed', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
