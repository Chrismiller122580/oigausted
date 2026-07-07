import { NextResponse } from 'next/server';
import { requireAdminPanelSession, requireAdminFromDb } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { labelToPrismaStatus, OrderStatusLabel } from '@/lib/order-status';
import { onlineSinceDate } from '@/lib/presence';

/** Lightweight stats payload for the Android home-screen admin widget. */
export async function GET() {
  try {
    const panelSession = await requireAdminPanelSession();
    if (!panelSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const isFullAdmin =
      panelSession.user?.role === 'admin' && (await requireAdminFromDb());

    if (isFullAdmin) {
      const onlineSince = onlineSinceDate();
      const [users, orders, onlineUsers, revenue] = await Promise.all([
        prisma.user.count(),
        prisma.order.count({
          where: { status: { not: labelToPrismaStatus(OrderStatusLabel.Pending) } },
        }),
        prisma.user.count({ where: { lastActiveAt: { gte: onlineSince } } }),
        prisma.order.aggregate({
          where: { status: labelToPrismaStatus(OrderStatusLabel.Completed) },
          _sum: { price: true },
        }),
      ]);

      return NextResponse.json({
        onlineUsers,
        users,
        orders,
        completedOrders: orders,
        totalRevenue: revenue._sum.price || 0,
        updatedAt: new Date().toISOString(),
      });
    }

    // Admin assistant staff — overview metrics
    const onlineSince = onlineSinceDate();
    const activeOrderStatuses = [
      labelToPrismaStatus(OrderStatusLabel.Pending),
      labelToPrismaStatus(OrderStatusLabel.Paid),
      labelToPrismaStatus(OrderStatusLabel.InProgress),
    ];

    const [ordersNeedingAttention, totalUsers, onlineUsers] = await Promise.all([
      prisma.order.count({ where: { status: { in: activeOrderStatuses } } }),
      prisma.user.count(),
      prisma.user.count({ where: { lastActiveAt: { gte: onlineSince } } }),
    ]);

    return NextResponse.json({
      onlineUsers,
      users: totalUsers,
      orders: ordersNeedingAttention,
      completedOrders: ordersNeedingAttention,
      totalRevenue: 0,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Admin widget stats error:', error);
    return NextResponse.json({ error: 'Failed to load widget stats' }, { status: 500 });
  }
}