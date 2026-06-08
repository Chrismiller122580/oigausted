import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// @ts-ignore
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notifications } from '@/lib/notifications'
import { logAuditEvent } from '@/lib/audit'
import { devLog, toPrismaJson, parseJsonArrayField, computePriceFromSelections, parseCustomFields } from '@/lib/utils'

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

    const isBuyer = existingOrder.buyerId === userId;
    const isSeller = existingOrder.sellerId === userId;

    // --- Server-side validations for live payments (price + required address) ---
    // 1. Fetch gig snapshot once (price + fields for dynamic pricing + isRemote for address rules).
    // 2. For non-remote gigs: enforce serviceAddress server-side (client only does a toast guard today).
    // 3. For dynamic fields: sanitize incoming customFields (strip any __* internal keys), then
    //    re-compute authoritative total from the published gig.fields snapshot using the shared util.
    //    Enforce the server value; audit mismatches. This is critical before real Wompi charges.
    let enforcedPrice: number | undefined = undefined;
    let gigSnap: { price: number | null; fields: any; isRemote: boolean | null } | null = null;

    try {
      gigSnap = await prisma.gig.findUnique({
        where: { id: existingOrder.gigId },
        select: { price: true, fields: true, isRemote: true }
      });
    } catch (e) {
      devLog('gig snapshot fetch failed (non-fatal)', e);
    }

    // Address enforcement for non-remote gigs (defense in depth for real money bookings)
    if (gigSnap && gigSnap.isRemote !== true) {
      const candidateAddress = serviceAddress !== undefined ? serviceAddress : existingOrder.serviceAddress;
      if (!candidateAddress || !String(candidateAddress).trim()) {
        return NextResponse.json(
          { error: 'La dirección del servicio es obligatoria para gigs locales/no-remotos' },
          { status: 400 }
        );
      }
    }

    // Price enforcement + sanitization (only when buyer is sending selections)
    if (customFields !== undefined && gigSnap) {
      try {
        const selections = parseCustomFields(customFields); // strips __* keys, normalizes to object
        const fieldDefs = parseJsonArrayField(gigSnap.fields);
        enforcedPrice = computePriceFromSelections(gigSnap.price || 0, fieldDefs, selections);

        if (price !== undefined) {
          const submitted = Number(price);
          if (Math.abs(submitted - enforcedPrice) > 1) {
            devLog('ORDER_PRICE_MISMATCH', { orderId, submitted, enforced: enforcedPrice });
            logAuditEvent({
              performedById: userId ?? undefined,
              action: 'ORDER_PRICE_MISMATCH',
              targetType: 'Order',
              targetId: orderId,
              details: toPrismaJson({ submitted, computed: enforcedPrice, gigId: existingOrder.gigId })
            }).catch(() => {});
          }
        }
      } catch (e) {
        devLog('price enforcement non-fatal error (will fall back)', e);
      }
    }
    // --- end live payment validations ---

    const updateData: any = {}

    if (status) {
      const validStatuses = ["Pending", "Paid", "In Progress", "Completed", "Cancelled"]
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }

      const current = existingOrder.status;

      // Role-aware transition rules (prevents buyers forcing completion, etc.)
      // Manual 'Paid' only via webhook (wompi) or admin.
      // Dev simulate is **only** allowed when NODE_ENV=development (for local/sandbox testing).
      // When real Wompi live keys are configured, do not rely on this path.
      if (!isAdmin) {
        if (status === 'Paid' && current !== 'Pending') {
          if (process.env.NODE_ENV !== 'development') {
            return NextResponse.json({ error: 'Cannot manually set to Paid outside payment flow' }, { status: 400 });
          }
          // Dev-only simulate (checkout page button is also gated to NODE_ENV=development).
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

    if (enforcedPrice !== undefined) {
      // Always enforce server-computed price when buyer supplied selections (anti-tamper for live)
      updateData.price = enforcedPrice;
    } else if (price !== undefined) {
      updateData.price = Number(price);
    }

    if (customFields !== undefined) {
      const sanitizedForStorage = parseCustomFields(customFields);
      updateData.customFields = Object.keys(sanitizedForStorage).length > 0
        ? JSON.stringify(sanitizedForStorage)
        : null;
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

    // Wrap core order status + audit + referral create + cancel earnings in tx for data integrity
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const u = await tx.order.update({
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
          } catch (e: any) {
            if (e.code !== 'P2002') devLog('tx referral create non-dup err:', e);
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

    // Note: sendNotification / notif calls are intentionally outside tx (side effects / email)

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
    devLog('Update status error:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
