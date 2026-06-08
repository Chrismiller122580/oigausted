import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { devLog } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  try {
    const [pendingOrders, openTickets, recentReferrals] = await Promise.all([
      prisma.order.count({ where: { status: 'Pending' } }),
      prisma.supportTicket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
      prisma.referralEarning.count({ where: { status: 'Pending' } }),
    ]);

    const wompiPublicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || '';
    const isWompiSandbox = wompiPublicKey.includes('test') || !wompiPublicKey;

    return NextResponse.json({
      activeChats: pendingOrders + openTickets, // rough proxy
      onlineSellers: recentReferrals, // proxy for activity
      pendingOrders,
      openTickets,
      wompiMode: isWompiSandbox ? 'sandbox' : 'live',
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
