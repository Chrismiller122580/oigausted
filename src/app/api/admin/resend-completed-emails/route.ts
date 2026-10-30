import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifications } from '@/lib/notifications'
import { OrderStatusLabel } from '@/lib/order-status'
import { devLog } from '@/lib/utils'

/**
 * One-off: resend completion confirmation emails for all Completed orders.
 * Auth: CRON_SECRET bearer or admin session.
 * ?dryRun=true to preview without sending.
 */
export async function GET(req: NextRequest) {
  return POST(req)
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim()
  const authHeader = req.headers.get('authorization')
  const isCronAuth = !!cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isCronAuth) {
    const { requireAdminFromDb } = await import('@/lib/admin-auth')
    const session = await requireAdminFromDb()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const dryRun = new URL(req.url).searchParams.get('dryRun') === 'true'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com'

  try {
    const orders = await prisma.order.findMany({
      where: { status: 'Completed' },
      select: {
        id: true,
        price: true,
        customFields: true,
        updatedAt: true,
        buyerId: true,
        sellerId: true,
        buyer: { select: { name: true, email: true } },
        seller: { select: { name: true, businessName: true, email: true } },
        gig: { select: { title: true } },
        files: { select: { name: true, url: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const results: Array<{
      orderId: string
      gigTitle: string
      buyer: string | null
      seller: string | null
      downloads: number
      sent: boolean
    }> = []

    for (const order of orders) {
      const downloadLinks: { label: string; url: string }[] = []

      try {
        const { orderIncludesSaleDocsBundle } = await import('@/lib/vehicle-sale-docs')
        if (orderIncludesSaleDocsBundle(order.customFields)) {
          downloadLinks.push(
            { label: 'Descargar contrato de compraventa', url: `${appUrl}/api/orders/${order.id}/sale-docs?doc=contract` },
            { label: 'Descargar checklist', url: `${appUrl}/api/orders/${order.id}/sale-docs?doc=checklist` },
          )
        }
      } catch (e) {
        devLog('[resend-completed] sale docs check failed', e)
      }

      for (const f of order.files) {
        if (f.url) downloadLinks.push({ label: f.name || 'Archivo del pedido', url: f.url })
      }

      const gigTitle = order.gig?.title || 'servicio'
      const amount = order.price
      const completedAt = order.updatedAt.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })

      const recipients = [
        { userId: order.buyerId, role: 'buyer' as const },
        { userId: order.sellerId, role: 'seller' as const },
      ]

      if (!dryRun) {
        // Also post download links into the order chat
        try {
          const chatLines = [
            'Pedido marcado como completado.',
            downloadLinks.length
              ? 'Descargas disponibles:\n' + downloadLinks.map(d => `• ${d.label}: ${d.url}`).join('\n')
              : 'No hay archivos adjuntos en este pedido.',
          ]
          await prisma.orderMessage.create({
            data: {
              orderId: order.id,
              content: chatLines.join('\n\n'),
              isFromBuyer: false,
            },
          })
        } catch (e) {
          devLog('[resend-completed] chat message failed', e)
        }

        for (const r of recipients) {
          try {
            await notifications.sendInApp(
              r.userId,
              'order',
              r.role === 'buyer' ? '¡Pedido completado!' : 'Pedido marcado como completado',
              r.role === 'buyer'
                ? `Tu pedido de "${gigTitle}" fue completado. Revisa la confirmación y, si aplica, las descargas.`
                : `El pedido de "${gigTitle}" quedó completado.`,
              `/orders/${order.id}`,
              {
                gigTitle,
                amount,
                orderId: order.id,
                newStatus: 'Completado',
                recipientRole: r.role,
                buyerName: order.buyer?.name || '',
                sellerName: order.seller?.businessName || order.seller?.name || '',
                downloadLinks,
                completedAt,
              },
              { priority: 'high' },
            )
          } catch (e) {
            devLog(`[resend-completed] send failed for ${order.id} ${r.role}`, e)
          }
        }
      }

      results.push({
        orderId: order.id,
        gigTitle,
        buyer: order.buyer?.email || null,
        seller: order.seller?.email || null,
        downloads: downloadLinks.length,
        sent: !dryRun,
      })
    }

    return NextResponse.json({
      ok: true,
      dryRun,
      count: results.length,
      results,
    })
  } catch (error) {
    console.error('[resend-completed] error', error)
    return NextResponse.json({ error: 'Failed to resend' }, { status: 500 })
  }
}
