import { prisma } from '@/lib/prisma';
import type { PlatformConfigRow } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';
import { getEffectiveReferralRate } from '@/lib/payout';
import { devLog } from '@/lib/utils';
import { Prisma } from '@prisma/client';

export type ReferralEligibleOrder = {
  id: string;
  price: number;
  seller?: {
    referredById: string | null;
  } | null;
};

/**
 * Create referral earning for a completed/paid order if the seller was referred.
 * Idempotent via unique constraint on (referrerId, orderId).
 * Also sends notification to referrer.
 * Server-only.
 */
export async function createReferralEarningIfApplicable(order: ReferralEligibleOrder) {
  if (!order.seller?.referredById || !order.price) return;

  // Master gate from admin settings
  try {
    const { prisma: prismaClient } = await import('@/lib/prisma');
    const { getPlatformConfig } = await import('@/lib/prisma');
    const cfg: PlatformConfigRow | null = await getPlatformConfig();
    if (cfg && cfg.referralsEnabled === false) {
      return; // Referrals globally paused by admin
    }
  } catch {}

  try {
    const referralRate = await getEffectiveReferralRate(order.seller.referredById);
    const referralAmount = Math.round(order.price * referralRate);

    if (referralAmount <= 0) return;

    await prisma.referralEarning.create({
      data: {
        amount: referralAmount,
        rateUsed: referralRate,
        referrerId: order.seller.referredById,
        orderId: order.id,
        status: 'Pending',
      }
    });

    // Notify referrer
    try {
      await sendNotification({
        userId: order.seller.referredById,
        category: 'payment',
        type: 'email',
        title: '¡Ganaste comisión por referido!',
        message: `Recibiste $${referralAmount.toLocaleString('es-CO')} de comisión por una venta completada.`,
        link: '/referrals'
      });
    } catch (e) {
      devLog('Failed to send referral earning email:', e);
    }
  } catch (err: unknown) {
    // Unique constraint violation is expected on duplicate calls (idempotent)
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) {
      devLog('Failed to create referral earning:', err);
    }
  }
}
