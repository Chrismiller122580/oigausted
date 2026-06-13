import { NextResponse } from 'next/server';
// @ts-ignore
// @ts-ignore
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateOrderPayout, DEFAULT_PAYOUT_CONFIG, aggregatePayouts } from '@/lib/payout';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let config = null;
    try {
      const { getPlatformConfig } = await import('@/lib/prisma');
      config = await getPlatformConfig();
    } catch (dbErr) {
      console.error('PlatformConfig query failed in reports (likely missing columns like referralsEnabled). Using defaults.', dbErr);
      config = null;
    }
    const platformRate = config?.commissionRate ?? DEFAULT_PAYOUT_CONFIG.platformCommissionRate;
    const referralRate = config?.referralCommissionRate ?? DEFAULT_PAYOUT_CONFIG.referralCommissionRate;

    // Get all completed orders with necessary relations
    const completedOrders = await prisma.order.findMany({
      where: { status: 'Completed' },
      // Explicit select to avoid missing columns (sellerPayoutAt etc) in prod DB
      select: {
        id: true,
        price: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        buyerId: true,
        sellerId: true,
        gigId: true,
        customFields: true,
        gig: { select: { category: true, title: true } },
        seller: { select: { id: true, name: true, email: true, referredById: true } },
        buyer: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Category breakdown
    const categoryMap = new Map<string, { count: number; revenue: number }>();
    for (const order of completedOrders) {
      const cat = order.gig?.category || 'No category';
      const price = Number(order.price) || 0;
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { count: 0, revenue: 0 });
      }
      const entry = categoryMap.get(cat)!;
      entry.count += 1;
      entry.revenue += price;
    }
    const categorySales = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        orders: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Top gigs by revenue (from completed orders)
    const gigMap = new Map<string, { title: string; count: number; revenue: number }>();
    for (const order of completedOrders) {
      const gigId = order.gigId;
      const title = order.gig?.title || 'Gig desconocido';
      const price = Number(order.price) || 0;
      if (!gigMap.has(gigId)) {
        gigMap.set(gigId, { title, count: 0, revenue: 0 });
      }
      const entry = gigMap.get(gigId)!;
      entry.count += 1;
      entry.revenue += price;
    }
    const topGigs = Array.from(gigMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Monthly revenue (last 6 months)
    const monthlyMap = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, 0);
    }
    for (const order of completedOrders) {
      const d = new Date(order.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap.has(key)) {
        monthlyMap.set(key, monthlyMap.get(key)! + (Number(order.price) || 0));
      }
    }
    const monthlyRevenue = Array.from(monthlyMap.entries()).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    // Top sellers by completed revenue
    const sellerMap = new Map<string, { name: string; email: string; revenue: number; orders: number }>();
    for (const order of completedOrders) {
      const sid = order.sellerId;
      const price = Number(order.price) || 0;
      const name = order.seller?.name || order.seller?.email || 'Vendedor';
      if (!sellerMap.has(sid)) {
        sellerMap.set(sid, { name, email: order.seller?.email || '', revenue: 0, orders: 0 });
      }
      const entry = sellerMap.get(sid)!;
      entry.revenue += price;
      entry.orders += 1;
    }
    const topSellers = Array.from(sellerMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // Basic retention: users with >1 completed order as buyer
    const buyerOrderCounts = new Map<string, number>();
    for (const order of completedOrders) {
      const bid = order.buyerId;
      buyerOrderCounts.set(bid, (buyerOrderCounts.get(bid) || 0) + 1);
    }
    const repeatBuyers = Array.from(buyerOrderCounts.values()).filter(c => c > 1).length;
    const totalBuyersWithOrders = buyerOrderCounts.size;

    // Platform revenue calc using payout lib for accuracy (like stats)
    const breakdowns = completedOrders.map((o: any) =>
      calculateOrderPayout(
        Number(o.price) || 0,
        !!o.seller?.referredById,
        { platformCommissionRate: platformRate, referralCommissionRate: referralRate }
      )
    );
    const aggregated = aggregatePayouts(breakdowns);

    return NextResponse.json({
      totalCompleted: completedOrders.length,
      grossRevenue: aggregated.grossAmount,
      platformRevenue: aggregated.platformFee,
      referralRevenue: aggregated.referralFee,
      netToSellers: aggregated.netToSeller,
      categorySales,
      monthlyRevenue,
      topGigs,
      topSellers,
      repeatBuyers,
      totalBuyersWithOrders,
      avgOrderValue: completedOrders.length > 0 
        ? Math.round(aggregated.grossAmount / completedOrders.length) 
        : 0,
    });
  } catch (error) {
    console.error('Admin reports error:', error);
    return NextResponse.json({ error: 'Error generando reportes' }, { status: 500 });
  }
}
