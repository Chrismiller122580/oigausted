import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notifications } from '@/lib/notifications'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await params
    const orderId = resolvedParams.id

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        gig: true,
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, businessName: true, email: true } }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const userId = (session?.user as any)?.id
    const isAdmin = (session?.user as any)?.role === 'admin'
    if (!isAdmin && order.buyerId !== userId && order.sellerId !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Fetch order error:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const resolvedParams = await params
    const orderId = resolvedParams.id
    const body = await request.json()
    const { status, price, customFields, serviceAddress, serviceLatitude, serviceLongitude } = body

    // Fetch order to enforce ownership
    const existingOrder = await prisma.order.findUnique({ where: { id: orderId } })
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    const isAdmin = (session?.user as any)?.role === 'admin'
    if (!isAdmin && existingOrder.buyerId !== userId && existingOrder.sellerId !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const updateData: any = {}

    if (status) {
      const validStatuses = ["Pending", "Paid", "In Progress", "Completed", "Cancelled"]
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updateData.status = status
    }

    if (price !== undefined) {
      updateData.price = Number(price)
    }

    if (customFields !== undefined) {
      updateData.customFields = customFields ? JSON.stringify(customFields) : null
    }

    if (serviceAddress !== undefined) {
      updateData.serviceAddress = serviceAddress || null
    }
    if (serviceLatitude !== undefined) {
      updateData.serviceLatitude = serviceLatitude
    }
    if (serviceLongitude !== undefined) {
      updateData.serviceLongitude = serviceLongitude
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        gig: true,
        buyer: { select: { id: true, name: true, email: true } },
        seller: { 
          select: { 
            id: true, 
            name: true, 
            businessName: true, 
            email: true,
            referredById: true 
          } 
        }
      }
    })

    // Create referral earning if order is completed and seller was referred.
    // Uses per-user custom rate if set on the referrer, otherwise global default (5%).
    // Note: The actual accounting (net to seller) lives in src/lib/payout.ts
    if (status === 'Completed' && updatedOrder.seller?.referredById) {
      try {
        const { getEffectiveReferralRate } = await import('@/lib/payout');
        const referralRate = await getEffectiveReferralRate(updatedOrder.seller.referredById);

        const referralAmount = Math.round(updatedOrder.price * referralRate);

        if (referralAmount > 0) {
          await prisma.referralEarning.create({
            data: {
              amount: referralAmount,
              rateUsed: referralRate,
              referrerId: updatedOrder.seller.referredById,
              orderId: updatedOrder.id,
              status: 'Pending',
            }
          });

          // Notify referrer
          try {
            const { sendNotification } = await import('@/lib/notifications')
            await sendNotification({
              userId: updatedOrder.seller.referredById,
              category: 'payment',
              type: 'email',
              title: '¡Ganaste comisión por referido!',
              message: `Recibiste $${referralAmount.toLocaleString('es-CO')} de comisión por una venta completada.`,
              link: '/referrals'
            })
          } catch (e) {
            console.error('Failed to send referral earning email:', e)
          }
        }
      } catch (err) {
        console.error('Failed to create referral earning:', err);
        // Don't fail the main request
      }
    }

    // Send notifications on important status changes
    if (status) {
      const recipientId = status === 'In Progress' || status === 'Completed' 
        ? updatedOrder.buyerId 
        : updatedOrder.sellerId

      // Smart contextual actions based on new status
      let actions: any[] = [{ label: 'Ver Pedido', action: 'view_order' }];

      if (status === 'In Progress') {
        actions = [
          { label: 'Ver Pedido', action: 'view_order' },
          { label: 'Marcar como Enviado', action: 'mark_as_shipped' },
        ];
      } else if (status === 'Completed') {
        actions = [
          { label: 'Ver Pedido', action: 'view_order' },
          { label: 'Dejar Reseña', action: 'request_review' },
        ];
      }

      await notifications.sendInApp(
        recipientId,
        'order',
        `Pedido actualizado a "${status}"`,
        `Tu pedido para "${updatedOrder.gig.title}" ha cambiado a estado: ${status}.`,
        `/orders/${orderId}`,
        { 
          gigTitle: updatedOrder.gig.title, 
          amount: updatedOrder.price, 
          orderId,
          newStatus: status,
          actions
        }
      )

      // Special nice notification when order is completed → prompt for review
      // (email for both status update + review prompt now sent automatically via the notification system)
      if (status === 'Completed') {
        await notifications.sendInApp(
          updatedOrder.buyerId,
          'review',
          '¡Pedido completado! Déjanos tu reseña',
          `Tu pedido "${updatedOrder.gig.title}" ha sido completado. ¿Nos dejas una reseña?`,
          `/orders/${orderId}`,
          { gigTitle: updatedOrder.gig.title, orderId }
        );
      }
    }

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('Update status error:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
