import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// @ts-ignore
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notifications } from '@/lib/notifications'
import { logAuditEvent } from '@/lib/audit'
import { devLog, toPrismaJson } from '@/lib/utils'

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
      // Explicit select + include to avoid missing DB columns like sellerPayoutAt
      select: {
        id: true,
        price: true,
        status: true,
        progress: true,
        trackingNumber: true,
        createdAt: true,
        updatedAt: true,
        buyerId: true,
        sellerId: true,
        gigId: true,
        customFields: true,
        serviceLatitude: true,
        serviceLongitude: true,
        serviceAddress: true,
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
    devLog('Fetch order error:', error)
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
    const { status, price, customFields, serviceAddress, serviceLatitude, serviceLongitude, wompiPayoutRef } = body

    // Fetch order to enforce ownership (explicit select to avoid missing columns like sellerPayoutAt in prod DB)
    const existingOrder = await prisma.order.findUnique({ 
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        buyerId: true,
        sellerId: true,
        gigId: true,
        price: true,
      }
    })
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    const isAdmin = (session?.user as any)?.role === 'admin'
    if (!isAdmin && existingOrder.buyerId !== userId && existingOrder.sellerId !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const isBuyer = existingOrder.buyerId === userId;
    const isSeller = existingOrder.sellerId === userId;

    const updateData: any = {}

    if (status) {
      const validStatuses = ["Pending", "Paid", "In Progress", "Completed", "Cancelled"]
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }

      const current = existingOrder.status;

      // Role-aware transition rules (prevents buyers forcing completion, etc.)
      // Manual 'Paid' only via webhook (wompi) or admin. Dev simulate allowed for testing.
      if (!isAdmin) {
        if (status === 'Paid' && current !== 'Pending') {
          if (process.env.NODE_ENV !== 'development') {
            return NextResponse.json({ error: 'Cannot manually set to Paid outside payment flow' }, { status: 400 });
          }
          // In dev, the simulate button (in checkout page) is allowed to force Paid for testing without webhook.
        }
        if (status === 'In Progress' && current !== 'Paid') {
          return NextResponse.json({ error: 'Order must be Paid before In Progress' }, { status: 400 });
        }
        if (status === 'Completed' && !['Paid', 'In Progress'].includes(current)) {
          return NextResponse.json({ error: 'Invalid transition to Completed' }, { status: 400 });
        }
        if (status === 'Cancelled' && !['Pending', 'Paid'].includes(current)) {
          return NextResponse.json({ error: 'Cannot cancel at this stage' }, { status: 400 });
        }
        if (status === 'In Progress' && !isSeller) {
          return NextResponse.json({ error: 'Only seller can mark In Progress' }, { status: 403 });
        }
        if (status === 'Completed' && !isSeller) {
          return NextResponse.json({ error: 'Only seller can mark Completed' }, { status: 403 });
        }
        if (status === 'Cancelled' && !isBuyer) {
          return NextResponse.json({ error: 'Only buyer can cancel' }, { status: 403 });
        }
      }

      updateData.status = status
    }

    if (price !== undefined) {
      const n = Number(price);
      updateData.price = Number.isFinite(n) ? n : existingOrder.price;
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

    const sellerPayoutAtUpdate = body.sellerPayoutAt !== undefined 
      ? (body.sellerPayoutAt ? new Date(body.sellerPayoutAt) : null) 
      : undefined;

    const wompiPayoutRefUpdate = body.wompiPayoutRef !== undefined 
      ? (body.wompiPayoutRef ? String(body.wompiPayoutRef).trim() : null) 
      : undefined;

    // sellerPayoutAt and wompiPayoutRef are intentionally never put into updateData (handled in best-effort blocks below to survive prod DB drift)

    let updatedOrder: any;

    // Safe select for Order + needed relations (avoids selecting columns like sellerPayoutAt/wompiPayoutRef that may be missing in prod DB)
    const safeOrderSelect = {
      id: true,
      price: true,
      status: true,
      progress: true,
      trackingNumber: true,
      createdAt: true,
      updatedAt: true,
      buyerId: true,
      sellerId: true,
      gigId: true,
      customFields: true,
      serviceAddress: true,
      serviceLatitude: true,
      serviceLongitude: true,
      gig: { select: { id: true, title: true, description: true, price: true, category: true } },
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
    } as const;

    if (Object.keys(updateData).length > 0 || status !== undefined || price !== undefined || customFields !== undefined || serviceAddress !== undefined || serviceLatitude !== undefined || serviceLongitude !== undefined) {
      // Wrap core order status + audit + referral create + cancel earnings in tx for data integrity
      updatedOrder = await prisma.$transaction(async (tx: any) => {
      const u = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        select: safeOrderSelect
      })

      // Audit inside tx (critical change)
      if (status || Object.keys(updateData).length > 0) {
        await tx.auditLog.create({
          data: {
            performedById: userId ?? undefined,
            action: status ? `ORDER_STATUS_${status.toUpperCase().replace(/\s+/g, '_')}` : 'ORDER_UPDATED',
            targetType: 'Order',
            targetId: orderId,
            details: toPrismaJson({
              previousStatus: existingOrder.status,
              newStatus: status || existingOrder.status,
              updatedFields: Object.keys(updateData),
              updatedByRole: (session?.user as any)?.role,
            }),
            // ip/ua if available in context (omitted here for brevity)
          },
        });
      }

      // Referral earning create inside tx (atomic with status)
      if ((status === 'Paid' || status === 'Completed') && (u as any).seller?.referredById) {
        const { getEffectiveReferralRate } = await import('@/lib/payout');
        const rate = await getEffectiveReferralRate((u as any).seller.referredById);
        const amount = Math.round(((u as any).price || 0) * rate);
        if (amount > 0) {
          try {
            await tx.referralEarning.create({
              data: {
                amount,
                rateUsed: rate,
                referrerId: (u as any).seller.referredById,
                orderId: (u as any).id,
                status: 'Pending',
              }
            });
          } catch (e: any) {
            if (e.code !== 'P2002') devLog('tx referral create non-dup err:', e);
          }
        }
      }

      // Cancel earnings on cancel inside tx
      if (status === 'Cancelled') {
        try {
          await tx.referralEarning.updateMany({
            where: { orderId: (u as any).id, status: { in: ['Pending', 'Requested'] } },
            data: { status: 'Cancelled' }
          });
        } catch (e) {
          devLog('Failed to cancel referral earnings on order cancel (tx):', e);
        }
      }

      return u;
    })
    } else {
      // No main update fields (e.g. only sellerPayoutAt from admin payouts page) - fetch current safely (no sellerPayoutAt col)
      updatedOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: safeOrderSelect
      });
    }

    // Best-effort update for sellerPayoutAt (separate to avoid breaking the tx if column missing in prod DB)
    if (sellerPayoutAtUpdate !== undefined) {
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: { sellerPayoutAt: sellerPayoutAtUpdate } as any,
        });
      } catch (payoutErr) {
        devLog('sellerPayoutAt update skipped (column may be missing in prod DB)', payoutErr);
      }
    }

    // Best-effort update for wompiPayoutRef (Wompi transfer id/ref for seller payouts via Pagos a Terceros)
    if (wompiPayoutRefUpdate !== undefined) {
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: { wompiPayoutRef: wompiPayoutRefUpdate } as any,
        });
      } catch (refErr) {
        devLog('wompiPayoutRef update skipped (column may be missing in prod DB)', refErr);
      }
    }

    if (!updatedOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Note: sendNotification / notif calls (prefs, quiet, rate, email via Resend) are intentionally outside tx (side effects).
    // Core domain (order + referral) is protected in tx. In-app notif creation is best-effort after for now.
    // (Full durable notif-in-tx would require refactoring the notifications lib to support tx context.)

    // Send notifications on important status changes
    if (status && updatedOrder) {
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
    devLog('Update status error:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
