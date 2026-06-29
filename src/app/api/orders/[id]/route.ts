import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyAdminFromDb, verifyAdminPanelAccess } from '@/lib/admin-auth'
import { notifications } from '@/lib/notifications'
import { logAuditEvent } from '@/lib/audit'
import { devLog, toPrismaJsonField } from '@/lib/utils'
import { computeOrderPrice } from '@/lib/order-price'
import { allowDevPaymentSimulate } from '@/lib/dev-flags'
import {
  isOrderStatusLabel,
  labelToPrismaStatus,
  prismaStatusToLabel,
  normalizeOrderStatus,
  OrderStatusLabel,
  type OrderStatusLabelValue,
} from '@/lib/order-status'
import type { Prisma } from '@prisma/client'
import type { JsonValue } from '@/types/json'

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
      referredById: true,
    },
  },
} as const satisfies Prisma.OrderSelect

type SafeOrder = Prisma.OrderGetPayload<{ select: typeof safeOrderSelect }>

interface NotificationAction {
  label: string
  action: string
}

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

    const userId = session?.user?.id
    const isAdmin = userId && session
      ? await verifyAdminPanelAccess(userId, session)
      : false
    if (!isAdmin && order.buyerId !== userId && order.sellerId !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    return NextResponse.json({
      order: { ...order, status: prismaStatusToLabel(order.status) },
    })
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
    const userId = session?.user?.id
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
    const isAdmin = userId
      ? await verifyAdminPanelAccess(userId, session)
      : false
    if (!isAdmin && existingOrder.buyerId !== userId && existingOrder.sellerId !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const isBuyer = existingOrder.buyerId === userId;
    const isSeller = existingOrder.sellerId === userId;

    const updateData: Prisma.OrderUpdateInput = {}

    if (status) {
      if (!isOrderStatusLabel(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }

      const statusLabel = status as OrderStatusLabelValue
      const prismaStatus = labelToPrismaStatus(statusLabel)
      const current = normalizeOrderStatus(existingOrder.status)

      // Role-aware transition rules (prevents buyers forcing completion, etc.)
      if (!isAdmin) {
        if (statusLabel === OrderStatusLabel.Paid) {
          if (!allowDevPaymentSimulate()) {
            return NextResponse.json({ error: 'Cannot manually set to Paid outside payment flow' }, { status: 400 });
          }
        }
        if (statusLabel === OrderStatusLabel.InProgress && current !== OrderStatusLabel.Paid) {
          devLog(
            `[orders PATCH] rejected In Progress for ${orderId}: current=${current} (requires Paid)`
          );
          return NextResponse.json(
            { error: 'El pedido debe estar pagado antes de iniciar el trabajo' },
            { status: 400 }
          );
        }
        if (
          statusLabel === OrderStatusLabel.Completed &&
          current !== OrderStatusLabel.Paid &&
          current !== OrderStatusLabel.InProgress
        ) {
          return NextResponse.json(
            { error: 'Solo puedes completar pedidos pagados o en progreso' },
            { status: 400 }
          );
        }
        if (statusLabel === OrderStatusLabel.Cancelled && current !== OrderStatusLabel.Pending) {
          return NextResponse.json(
            { error: 'Solo puedes cancelar pedidos pendientes de pago' },
            { status: 400 }
          );
        }
        if (statusLabel === OrderStatusLabel.InProgress && !isSeller) {
          return NextResponse.json({ error: 'Only seller can mark In Progress' }, { status: 403 });
        }
        if (statusLabel === OrderStatusLabel.Completed && !isSeller) {
          return NextResponse.json({ error: 'Only seller can mark Completed' }, { status: 403 });
        }
        if (statusLabel === OrderStatusLabel.Cancelled && !isBuyer) {
          return NextResponse.json({ error: 'Only buyer can cancel' }, { status: 403 });
        }
      }

      updateData.status = prismaStatus
    }

    if (customFields !== undefined) {
      const currentForFields = normalizeOrderStatus(existingOrder.status)
      if (!isAdmin && currentForFields !== OrderStatusLabel.Pending) {
        return NextResponse.json(
          { error: 'No se pueden modificar los detalles después del pago' },
          { status: 400 }
        )
      }
      if (!isAdmin && !isBuyer) {
        return NextResponse.json({ error: 'Solo el comprador puede actualizar los detalles' }, { status: 403 })
      }
      updateData.customFields = customFields ? JSON.stringify(customFields) : null
      const gig = await prisma.gig.findUnique({
        where: { id: existingOrder.gigId },
        select: { price: true, fields: true },
      })
      if (!gig) {
        return NextResponse.json({ error: 'Gig not found' }, { status: 404 })
      }
      const selections =
        customFields && typeof customFields === 'object' && !Array.isArray(customFields)
          ? customFields
          : {}
      updateData.price = computeOrderPrice(gig.price, gig.fields, selections)
    } else if (price !== undefined) {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Price cannot be changed directly' }, { status: 403 })
      }
      const n = Number(price)
      updateData.price = Number.isFinite(n) ? n : existingOrder.price
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

    let updatedOrder: SafeOrder | null = null;

    if (Object.keys(updateData).length > 0 || status !== undefined || price !== undefined || customFields !== undefined || serviceAddress !== undefined || serviceLatitude !== undefined || serviceLongitude !== undefined) {
      // Wrap core order status + audit + referral create + cancel earnings in tx for data integrity
      updatedOrder = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
            details: toPrismaJsonField({
              previousStatus: existingOrder.status,
              newStatus: status || existingOrder.status,
              updatedFields: Object.keys(updateData),
              updatedByRole: session?.user?.role,
            }),
            // ip/ua if available in context (omitted here for brevity)
          },
        });
      }

      // Referral earning create inside tx (atomic with status)
      if ((status === 'Paid' || status === 'Completed') && u.seller?.referredById) {
        const { getEffectiveReferralRate } = await import('@/lib/payout');
        const rate = await getEffectiveReferralRate(u.seller.referredById);
        const amount = Math.round((u.price || 0) * rate);
        if (amount > 0) {
          try {
            await tx.referralEarning.create({
              data: {
                amount,
                rateUsed: rate,
                referrerId: u.seller.referredById,
                orderId: u.id,
                status: 'Pending',
              }
            });
          } catch (e: unknown) {
            const code = e && typeof e === 'object' && 'code' in e ? (e as { code?: string }).code : undefined;
            if (code !== 'P2002') devLog('tx referral create non-dup err:', e);
          }
        }
      }

      // Cancel earnings on cancel inside tx
      if (status === 'Cancelled') {
        try {
          await tx.referralEarning.updateMany({
            where: { orderId: u.id, status: { in: ['Pending', 'Requested'] } },
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

    if ((sellerPayoutAtUpdate !== undefined || wompiPayoutRefUpdate !== undefined) && !isAdmin) {
      return NextResponse.json({ error: 'Only admins can update payout fields' }, { status: 403 })
    }

    let payoutFieldsUpdateFailed = false;

    if (sellerPayoutAtUpdate !== undefined) {
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: { sellerPayoutAt: sellerPayoutAtUpdate } as Prisma.OrderUpdateInput,
        });
      } catch (payoutErr) {
        payoutFieldsUpdateFailed = true;
        devLog('sellerPayoutAt update failed', payoutErr);
      }
    }

    if (wompiPayoutRefUpdate !== undefined) {
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: { wompiPayoutRef: wompiPayoutRefUpdate } as Prisma.OrderUpdateInput,
        });
      } catch (refErr) {
        payoutFieldsUpdateFailed = true;
        devLog('wompiPayoutRef update failed', refErr);
      }
    }

    if (
      payoutFieldsUpdateFailed &&
      (sellerPayoutAtUpdate !== undefined || wompiPayoutRefUpdate !== undefined)
    ) {
      return NextResponse.json(
        { error: 'No se pudo guardar el pago. Verifica que la migración sellerPayoutAt esté aplicada.' },
        { status: 500 }
      );
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
      let actions: NotificationAction[] = [{ label: 'Ver Pedido', action: 'view_order' }];

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
          actions: actions as unknown as JsonValue,
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

    return NextResponse.json({
      order: updatedOrder
        ? { ...updatedOrder, status: prismaStatusToLabel(updatedOrder.status) }
        : updatedOrder,
    })
  } catch (error) {
    devLog('Update status error:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}

// DELETE - Admin only: remove test orders (cascades to messages/files if configured)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const orderId = resolvedParams.id
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const isFullAdmin = userId && session?.user?.role === 'admin'
      ? await verifyAdminFromDb(userId)
      : false;

    if (!isFullAdmin) {
      return NextResponse.json({ error: 'Only admins can delete orders' }, { status: 403 });
    }

    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Delete dependents first (in case no cascade)
    await prisma.orderMessage.deleteMany({ where: { orderId } });
    await prisma.orderFile.deleteMany({ where: { orderId } });
    await prisma.review.deleteMany({ where: { orderId } });
    await prisma.referralEarning.deleteMany({ where: { orderId } });

    await prisma.order.delete({ where: { id: orderId } });

    await logAuditEvent({
      performedById: userId!,
      action: 'ORDER_DELETED',
      targetType: 'Order',
      targetId: orderId,
      details: { previousStatus: existing.status },
    });

    return NextResponse.json({ success: true, message: `Order ${orderId} deleted` });
  } catch (error) {
    devLog('Delete order error:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
