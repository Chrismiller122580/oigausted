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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const resolvedParams = await params
    const orderId = resolvedParams.id
    const body = await request.json()
    const { status, price, customFields } = body

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

    // Create referral earning if order is completed and seller was referred
    if (status === 'Completed' && updatedOrder.seller?.referredById) {
      try {
        const config = await prisma.platformConfig.findFirst();
        const referralRate = config?.referralCommissionRate ?? 0.05;

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

      await notifications.sendInApp(
        recipientId,
        'order',
        `Pedido actualizado a "${status}"`,
        `Tu pedido para "${updatedOrder.gig.title}" ha cambiado a estado: ${status}.`,
        `/orders/${orderId}`
      )

      // Send real email for key status changes
      if (['In Progress', 'Completed', 'Cancelled'].includes(status)) {
        await notifications.sendEmail(
          recipientId,
          `Actualización de pedido: ${status}`,
          `El estado de tu pedido para "${updatedOrder.gig.title}" ahora es: ${status}.`,
          `/orders/${orderId}`,
          { 
            gigTitle: updatedOrder.gig.title, 
            amount: updatedOrder.price, 
            orderId,
            newStatus: status 
          }
        )
      }

      // Special nice notification when order is completed → prompt for review
      if (status === 'Completed') {
        await notifications.sendInApp(
          updatedOrder.buyerId,
          'review',
          '¡Pedido completado! Déjanos tu reseña',
          `Tu pedido "${updatedOrder.gig.title}" ha sido completado. ¿Nos dejas una reseña?`,
          `/orders/${orderId}`
        );

        await notifications.sendEmail(
          updatedOrder.buyerId,
          '¡Tu pedido está completo! Cuéntanos cómo te fue',
          `Gracias por confiar en OigaUsted. Tu servicio "${updatedOrder.gig.title}" ha sido marcado como completado. Nos encantaría saber tu opinión.`,
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
