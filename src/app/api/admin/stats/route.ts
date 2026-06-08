import { NextResponse } from 'next/server';
// @ts-ignore
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { devLog } from '@/lib/utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
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
      prisma.gig.count(),
      prisma.gig.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'Completed' } }),
      prisma.order.aggregate({
        where: { status: 'Completed' },
        _sum: { price: true }
      }),
      prisma.order.count({
        where: {
          status: 'Completed',
          // For beta we consider "not paid out" as any completed without a payout flag
          // (we can enhance later with a payout model)
        }
      }),
      prisma.category.count()
    ]);

    const totalRevenue = totalRevenueResult._sum.price || 0;

    const config = await prisma.platformConfig.findFirst();

    // Use the canonical payout calculation for accuracy
    const { aggregatePayouts, calculateOrderPayout, DEFAULT_PAYOUT_CONFIG } = await import('@/lib/payout');

    // For stats we need to know which sellers were referred
    const completedOrdersWithReferral = await prisma.order.findMany({
      where: { status: 'Completed' },
      select: {
        price: true,
        seller: { select: { referredById: true } }
      }
    });

    const breakdowns = completedOrdersWithReferral.map(o =>
      calculateOrderPayout(
        Number(o.price) || 0,
        !!o.seller?.referredById,
        {
          platformCommissionRate: config?.commissionRate ?? DEFAULT_PAYOUT_CONFIG.platformCommissionRate,
          referralCommissionRate: config?.referralCommissionRate ?? DEFAULT_PAYOUT_CONFIG.referralCommissionRate,
        }
      )
    );

    const aggregated = aggregatePayouts(breakdowns);

    const platformRevenue = aggregated.platformFee;
    const estimatedReferralRevenue = aggregated.referralFee; // more accurate than old estimate

    return NextResponse.json({
      users: totalUsers,
      sellers: totalSellers,
      gigs: totalGigs,
      activeGigs,
      orders: totalOrders,
      completedOrders,
      totalCategories,
      totalRevenue: aggregated.grossAmount,
      platformRevenue,
      estimatedReferralRevenue,
      pendingPayouts: aggregated.netToSeller, // now the real net amount owed to sellers
      pendingReviews: 0, // can be improved later
      wompiMode: (process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || '').includes('test') ? 'sandbox' : 'live',
      wompiWarning: (process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || '').includes('test') ? 'Using Wompi SANDBOX keys — real payments disabled' : null,
    });
  } catch (error) {
    devLog('Admin stats error:', error);
    return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 });
  }
}
