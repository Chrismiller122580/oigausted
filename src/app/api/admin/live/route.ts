import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { devLog } from '@/lib/utils';
import { OrderStatusLabel, labelToPrismaStatus } from '@/lib/order-status';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  try {
    const [pendingOrders, openTickets, recentReferrals] = await Promise.all([
      prisma.order.count({ where: { status: labelToPrismaStatus(OrderStatusLabel.Pending) } }),
      prisma.supportTicket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
      prisma.referralEarning.count({ where: { status: 'Pending' } }),
    ]);

    return NextResponse.json({
      activeChats: pendingOrders + openTickets, // rough proxy
      onlineSellers: recentReferrals, // proxy for activity
      pendingOrders,
      openTickets,
      message: "Live admin data (real)"
    });
  } catch (e) {
    devLog('admin/live error:', e);
    return NextResponse.json({
      activeChats: 0,
      onlineSellers: 0,
      pendingOrders: 0,
      openTickets: 0,
      message: "Live admin data (partial)"
    });
  }
}
