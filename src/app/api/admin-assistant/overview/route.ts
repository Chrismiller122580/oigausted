import { NextResponse } from 'next/server';
import { requireAdminPanelSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { labelToPrismaStatus, OrderStatusLabel } from '@/lib/order-status';
import { onlineSinceDate } from '@/lib/presence';

export async function GET() {
  try {
    const session = await requireAdminPanelSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const onlineSince = onlineSinceDate();
    const activeOrderStatuses = [
      labelToPrismaStatus(OrderStatusLabel.Pending),
      labelToPrismaStatus(OrderStatusLabel.Paid),
      labelToPrismaStatus(OrderStatusLabel.InProgress),
    ];

    const [ordersNeedingAttention, openSupportTickets, totalUsers, onlineUsers] = await Promise.all([
      prisma.order.count({ where: { status: { in: activeOrderStatuses } } }),
      prisma.supportTicket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
      prisma.user.count(),
      prisma.user.count({ where: { lastActiveAt: { gte: onlineSince } } }),
    ]);

    return NextResponse.json({
      ordersNeedingAttention,
      openSupportTickets,
      totalUsers,
      onlineUsers,
    });
  } catch (error) {
    console.error('Admin assistant overview error:', error);
    return NextResponse.json({ error: 'Failed to load overview' }, { status: 500 });
  }
}