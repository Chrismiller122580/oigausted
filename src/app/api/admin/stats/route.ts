import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
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
      pendingPayouts
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
      })
    ]);

    const totalRevenue = totalRevenueResult._sum.price || 0;

    // Read live platform + referral commissions from settings
    const config = await prisma.platformConfig.findFirst();
    const platformRate = config?.commissionRate ?? 0.12;

    const platformRevenue = Math.round(totalRevenue * platformRate);

    // Use real referral earnings if available, otherwise fall back to estimate
    const realReferralEarnings = await prisma.referralEarning.aggregate({
      where: { status: { in: ['Pending', 'Paid'] } },
      _sum: { amount: true }
    });
    const estimatedReferralRevenue = realReferralEarnings._sum.amount || Math.round(totalRevenue * (config?.referralCommissionRate ?? 0.05));

    return NextResponse.json({
      users: totalUsers,
      sellers: totalSellers,
      gigs: totalGigs,
      activeGigs,
      orders: totalOrders,
      completedOrders,
      totalRevenue,
      platformRevenue,
      estimatedReferralRevenue,
      pendingPayouts: completedOrders, // simplified for beta
      pendingReviews: 0 // can be improved later
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 });
  }
}
