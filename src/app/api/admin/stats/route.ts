import { NextResponse } from 'next/server';
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { devLog } from '@/lib/utils';
import { isMissingColumnError } from '@/lib/user-profile-update';
import { OrderStatusLabel, labelToPrismaStatus } from '@/lib/order-status';

/** Avoid re-querying a missing column on warm serverless instances (prevents log spam + 25P02 cascades). */
let sellerPayoutAtAvailable: boolean | null = null;

async function fetchCompletedOrdersForPayoutStats() {
  const where = { status: labelToPrismaStatus(OrderStatusLabel.Completed) };
  const baseSelect = {
    price: true,
    seller: { select: { referredById: true } },
  } as const;

  if (sellerPayoutAtAvailable === false) {
    const rows = await prisma.order.findMany({ where, select: baseSelect });
    return rows.map((o) => ({ ...o, sellerPayoutAt: null as Date | null }));
  }

  try {
    const rows = await prisma.order.findMany({
      where,
      select: { ...baseSelect, sellerPayoutAt: true },
    });
    sellerPayoutAtAvailable = true;
    return rows;
  } catch (e) {
    if (!isMissingColumnError(e)) throw e;
    sellerPayoutAtAvailable = false;
    devLog('sellerPayoutAt column missing in stats — using fallback (run prisma migrate deploy)');
    const rows = await prisma.order.findMany({ where, select: baseSelect });
    return rows.map((o) => ({ ...o, sellerPayoutAt: null as Date | null }));
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const [
      totalUsers,
      totalSellers,
      totalGigs,
      activeGigs,
      totalOrders,
      completedOrders,
      totalRevenueResult,
      pendingPayouts,
      totalCategories
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'seller' } }),
      // Use deletedAt filter for soft-deleted gigs (with fallback if column missing in DB)
      (async () => {
        try {
          return await prisma.gig.count({ where: { deletedAt: null } });
        } catch (e) {
          devLog('deletedAt filter in stats failed, falling back (column may be missing)');
          return await prisma.gig.count();
        }
      })(),
      (async () => {
        try {
          return await prisma.gig.count({ where: { isActive: true, deletedAt: null } });
        } catch (e) {
          devLog('deletedAt filter in stats failed, falling back (column may be missing)');
          return await prisma.gig.count({ where: { isActive: true } });
        }
      })(),
      // Filter out pure Pending (often test/incomplete) for "Total Orders" on dashboard
      // to avoid showing stale/test data after cleanups. Use completed + in-progress as "real" volume.
      (async () => {
        try {
          return await prisma.order.count({
            where: { status: { not: labelToPrismaStatus(OrderStatusLabel.Pending) } },
          });
        } catch (e) {
          devLog('filtered orders count failed, falling back');
          return await prisma.order.count();
        }
      })(),
      prisma.order.count({ where: { status: labelToPrismaStatus(OrderStatusLabel.Completed) } }),
      prisma.order.aggregate({
        where: { status: labelToPrismaStatus(OrderStatusLabel.Completed) },
        _sum: { price: true }
      }),
      prisma.order.count({
        where: {
          status: labelToPrismaStatus(OrderStatusLabel.Completed),
          // For beta we consider "not paid out" as any completed without a payout flag
          // (we can enhance later with a payout model)
        }
      }),
      prisma.category.count({ where: { isActive: true } })
    ]);

    const totalRevenue = totalRevenueResult._sum.price || 0;

    let config: { commissionRate: number; referralCommissionRate: number } | null = null;
    try {
      config = await prisma.platformConfig.findFirst({
        select: {
          commissionRate: true,
          referralCommissionRate: true,
          // other fields if needed; omitting new wompiSftp* to avoid column errors
        }
      });
    } catch (e) {
      devLog('PlatformConfig find in stats failed (possible missing columns), using defaults');
      config = { commissionRate: 0.12, referralCommissionRate: 0.05 };
    }

    // Use the canonical payout calculation for accuracy
    const { aggregatePayouts, calculateOrderPayout, DEFAULT_PAYOUT_CONFIG } = await import('@/lib/payout');

    const completedOrdersWithReferral = await fetchCompletedOrdersForPayoutStats();

    // Only unpaid (no sellerPayoutAt) count toward pending payouts
    const unpaidCompletedOrders = completedOrdersWithReferral.filter(o => !o.sellerPayoutAt);

    // All completed for historical revenue stats
    const allBreakdowns = completedOrdersWithReferral.map(o =>
      calculateOrderPayout(
        Number(o.price) || 0,
        !!o.seller?.referredById,
        {
          platformCommissionRate: config?.commissionRate ?? DEFAULT_PAYOUT_CONFIG.platformCommissionRate,
          referralCommissionRate: config?.referralCommissionRate ?? DEFAULT_PAYOUT_CONFIG.referralCommissionRate,
        }
      )
    );
    const allAggregated = aggregatePayouts(allBreakdowns);

    // Only unpaid for pending payouts (respects sellerPayoutAt; shows 0 when none due)
    const unpaidBreakdowns = unpaidCompletedOrders.map(o =>
      calculateOrderPayout(
        Number(o.price) || 0,
        !!o.seller?.referredById,
        {
          platformCommissionRate: config?.commissionRate ?? DEFAULT_PAYOUT_CONFIG.platformCommissionRate,
          referralCommissionRate: config?.referralCommissionRate ?? DEFAULT_PAYOUT_CONFIG.referralCommissionRate,
        }
      )
    );
    const unpaidAggregated = aggregatePayouts(unpaidBreakdowns);

    const platformRevenue = allAggregated.platformFee;
    const estimatedReferralRevenue = allAggregated.referralFee;

    return NextResponse.json({
      users: totalUsers,
      sellers: totalSellers,
      gigs: totalGigs,
      activeGigs,
      orders: totalOrders,
      completedOrders,
      totalCategories,
      totalRevenue: allAggregated.grossAmount,
      platformRevenue,
      estimatedReferralRevenue,
      pendingPayouts: unpaidAggregated.netToSeller, // only the net still due to sellers (0 when none due)
      pendingReviews: 0 // can be improved later
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 });
  }
}
