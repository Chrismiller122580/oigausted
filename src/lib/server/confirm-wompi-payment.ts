import { prisma } from '@/lib/prisma';
import { notifications } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';
import { devLog } from '@/lib/utils';
import { getEffectiveReferralRate } from '@/lib/payout';
import { createReferralEarningIfApplicable } from '@/lib/server/referral-earnings';
import { notifyAdminsPaymentReceived } from '@/lib/admin-notifications';
import { OrderStatusLabel, labelToPrismaStatus, prismaStatusToLabel } from '@/lib/order-status';
import { Prisma } from '@prisma/client';

/**
 * Confirm a Wompi payment for an order.
 * - Idempotent: safe to call multiple times for same tx.
 * - Uses $transaction for status change + referralEarning insert (atomic).
 * - Sends buyer "pago confirmado" in-app notification.
 * - Creates audit log.
 * - Best-effort triggers the (idempotent) referral earning helper for notifier side-effects.
 *
 * Use from: wompi webhook (on transaction.updated + APPROVED) and from /check-wompi manual recovery.
 */
export async function confirmWompiPayment(
  orderId: string,
  opts?: {
    wompiTransactionId?: string;
    wompiStatus?: string;
    amount?: number; // in major units for audit
    reference?: string;
  }
): Promise<{ success: boolean; alreadyProcessed?: boolean; newStatus?: string; message?: string; error?: string }> {
  try {
    // Load rich order data (explicit select for prod DB compatibility)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        price: true,
        buyerId: true,
        sellerId: true,
        gigId: true,
        buyer: { select: { id: true, name: true } },
        gig: { select: { title: true } },
        seller: { select: { id: true, referredById: true } },
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const current = order.status;
    const currentLabel = prismaStatusToLabel(current);
    if (currentLabel === OrderStatusLabel.Paid || currentLabel === OrderStatusLabel.Completed) {
      devLog(`[Wompi][confirm] Order ${orderId} already ${currentLabel}, skipping`);
      return { success: true, alreadyProcessed: true, newStatus: currentLabel, message: 'Already processed' };
    }

    if (opts?.amount != null) {
      const expectedCents = Math.round(order.price * 100);
      const receivedCents = Math.round(opts.amount * 100);
      if (receivedCents !== expectedCents) {
        devLog(`[Wompi][confirm] Amount mismatch for order ${orderId}: expected ${expectedCents}c, got ${receivedCents}c`);
        return {
          success: false,
          error: `Payment amount mismatch (expected ${order.price} COP, received ${opts.amount} COP)`,
        };
      }
    }

    // Only confirm to Paid on success path
    const updateData = { status: labelToPrismaStatus(OrderStatusLabel.Paid), updatedAt: new Date() };

    // Atomic: update status + create referral earning if seller was referred (prevents orphans)
    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const u = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        select: {
          id: true,
          status: true,
          price: true,
          buyerId: true,
          sellerId: true,
          gigId: true,
          buyer: { select: { id: true, name: true } },
          gig: { select: { title: true } },
          seller: { select: { id: true, referredById: true } },
        },
      });

      // Referral earning inside the tx for atomicity (same pattern as before)
      if (u.seller?.referredById) {
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
              },
            });
          } catch (e: unknown) {
            if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) {
              devLog('[Wompi confirm tx] referral create err (non-dup):', e);
            }
          }
        }
      }

      return u;
    });

    // Audit (best effort, after commit)
    await logAuditEvent({
      performedById: null, // system / payment confirmation
      action: 'PAYMENT_APPROVED',
      targetType: 'Order',
      targetId: orderId,
      details: {
        wompiTransactionId: opts?.wompiTransactionId || null,
        status: opts?.wompiStatus || 'APPROVED',
        amount: opts?.amount ?? updated.price,
        reference: opts?.reference || `order_${orderId}`,
        triggeredBy: 'confirmWompiPayment',
      },
    }).catch(() => {});

    // Buyer in-app notification (payment confirmed)
    if (updated.buyer?.id) {
      try {
        await notifications.sendInApp(
          updated.buyer.id,
          'payment',
          '¡Pago confirmado!',
          `Tu pago por "${updated.gig?.title || 'el servicio'}" fue exitoso.`,
          `/orders/${orderId}`,
          { gigTitle: updated.gig?.title, amount: updated.price, orderId }
        );
      } catch (nErr) {
        devLog('[Wompi confirm] notif error (non-fatal):', nErr);
      }
    }

    // Seller can start work only after payment — offer action here, not on Pending order creation
    if (updated.sellerId) {
      try {
        await notifications.sendNotification({
          userId: updated.sellerId,
          category: 'order',
          type: 'in_app',
          priority: 'high',
          title: '¡Pago recibido! Inicia el trabajo',
          message: `El pedido por "${updated.gig?.title || 'el servicio'}" fue pagado. Acepta e inicia el trabajo cuando estés listo.`,
          link: `/orders/${orderId}`,
          data: {
            gigTitle: updated.gig?.title,
            amount: updated.price,
            orderId,
            buyerName: updated.buyer?.name,
            newStatus: 'Paid',
            actions: [
              { label: 'Ver Pedido', action: 'view_order' },
              { label: 'Aceptar e Iniciar', action: 'start_order' },
            ],
          },
        });
      } catch (nErr) {
        devLog('[Wompi confirm] seller notif error (non-fatal):', nErr);
      }
    }

    // Best-effort: run the full referral helper (it guards duplicates + sends referrer email/notif)
    if (updated.seller?.referredById) {
      try {
        await createReferralEarningIfApplicable(updated);
      } catch (rErr) {
        devLog('[Wompi confirm] referral helper error (non-fatal):', rErr);
      }
    }

    notifyAdminsPaymentReceived({
      orderId,
      gigTitle: updated.gig?.title || 'Servicio',
      amount: updated.price,
      buyerName: updated.buyer?.name,
      wompiTransactionId: opts?.wompiTransactionId,
    }).catch((e) => devLog('[Wompi confirm] admin email failed (non-fatal):', e))

    devLog(`[Wompi] ✅ APPROVED via confirm helper - Order ${orderId} now Paid`);
    return {
      success: true,
      newStatus: 'Paid',
      message: 'Order confirmed as Paid from Wompi transaction',
    };
  } catch (error: unknown) {
    devLog('[Wompi][confirm] error:', error);
    const message = error instanceof Error ? error.message : 'Confirmation failed';
    return { success: false, error: message };
  }
}
