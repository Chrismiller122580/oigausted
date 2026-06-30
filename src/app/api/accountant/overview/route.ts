import { NextResponse } from 'next/server';
import { requireFinancePanelSession } from '@/lib/admin-auth';
import { getPlatformConfig } from '@/lib/prisma';
import { runPayoutAudit } from '@/lib/payout-audit';
import {
  aggregatePayouts,
  calculateOrderPayout,
  DEFAULT_PAYOUT_CONFIG,
} from '@/lib/payout';
import { prisma } from '@/lib/prisma';
import { OrderStatusLabel, labelToPrismaStatus } from '@/lib/order-status';

export async function GET() {
  try {
    const session = await requireFinancePanelSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [audit, config, completedOrders] = await Promise.all([
      runPayoutAudit(),
      getPlatformConfig(),
      prisma.order.findMany({
        where: { status: labelToPrismaStatus(OrderStatusLabel.Completed) },
        select: {
          price: true,
          seller: { select: { referredById: true } },
        },
      }),
    ]);

    const rates = {
      platformCommissionRate:
        config?.commissionRate ?? DEFAULT_PAYOUT_CONFIG.platformCommissionRate,
      referralCommissionRate:
        config?.referralCommissionRate ?? DEFAULT_PAYOUT_CONFIG.referralCommissionRate,
    };

    const breakdowns = completedOrders.map((order: (typeof completedOrders)[number]) =>
      calculateOrderPayout(
        Number(order.price) || 0,
        !!order.seller?.referredById,
        rates
      )
    );
    const aggregated = aggregatePayouts(breakdowns);

    return NextResponse.json({
      pendingPayoutsNetCOP: audit.payouts.completedUnpaidNetCOP,
      pendingPayoutCount: audit.payouts.completedUnpaidCount,
      pendingReferralsCOP: audit.referrals.pendingAmountCOP,
      totalRevenueCOP: aggregated.grossAmount,
      platformRevenueCOP: aggregated.platformFee,
      payoutsHealthy: audit.healthy,
    });
  } catch (error) {
    console.error('Accountant overview error:', error);
    return NextResponse.json({ error: 'Failed to load overview' }, { status: 500 });
  }
}