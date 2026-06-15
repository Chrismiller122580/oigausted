import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { devLog } from '@/lib/utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const uid = session?.user?.id;
    if (!uid) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }
    const role = session?.user?.role;
    if (role !== 'seller' && role !== 'admin') {
      return NextResponse.json({ error: 'Solo vendedores pueden acceder' }, { status: 403 });
    }

    const sellerId = uid;

    let gigs;
    try {
      gigs = await prisma.gig.findMany({
        where: { sellerId, deletedAt: null },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              businessName: true,
              profilePicture: true,
              rating: true,
              reviewCount: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (dbErr: unknown) {
      const errMsg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      console.warn('[Seller Gigs] query with full model failed (likely missing deletedAt column), retrying', errMsg);
      gigs = await prisma.gig.findMany({
        where: { sellerId, deletedAt: null },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          category: true,
          completionTime: true,
          imageUrl: true,
          fields: true,
          addons: true,
          isActive: true,
          createdAt: true,
          sellerId: true,
          city: true,
          latitude: true,
          longitude: true,
          isRemote: true,
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              businessName: true,
              profilePicture: true,
              rating: true,
              reviewCount: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Compute performance stats per gig (orders + revenue)
    const gigIds = gigs.map((g: { id: string }) => g.id);

    const orderAggregates = await prisma.order.groupBy({
      by: ['gigId'],
      where: {
        gigId: { in: gigIds },
        sellerId
      },
      _count: { _all: true },
      _sum: { price: true }
    });

    // Also get completed revenue separately for accuracy
    const completedAggregates = await prisma.order.groupBy({
      by: ['gigId'],
      where: {
        gigId: { in: gigIds },
        sellerId,
        status: 'Completed'
      },
      _count: { _all: true },
      _sum: { price: true }
    });

    const statsMap = new Map<string, { orderCount: number; totalRevenue: number; completedCount: number; completedRevenue: number }>();
    for (const agg of orderAggregates) {
      statsMap.set(agg.gigId, {
        orderCount: agg._count._all || 0,
        totalRevenue: Number(agg._sum.price || 0),
        completedCount: 0,
        completedRevenue: 0
      });
    }
    for (const agg of completedAggregates) {
      const existing = statsMap.get(agg.gigId) || { orderCount: 0, totalRevenue: 0, completedCount: 0, completedRevenue: 0 };
      statsMap.set(agg.gigId, {
        ...existing,
        completedCount: agg._count._all || 0,
        completedRevenue: Number(agg._sum.price || 0)
      });
    }

    const gigsWithStats = gigs.map((gig: (typeof gigs)[number]) => ({
      ...gig,
      stats: statsMap.get(gig.id) || {
        orderCount: 0,
        totalRevenue: 0,
        completedCount: 0,
        completedRevenue: 0
      }
    }));

    devLog(`📦 /api/seller/gigs returned ${gigs.length} gigs + stats for seller ${sellerId}`);

    return NextResponse.json({
      gigs: gigsWithStats,
      count: gigsWithStats.length
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("❌ /api/seller/gigs failed:", errMsg);
    return NextResponse.json({
      gigs: [],
      count: 0,
      error: errMsg
    }, { status: 500 });
  }
}
