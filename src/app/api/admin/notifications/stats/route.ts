import { NextResponse } from 'next/server';
import { requireAdminFromDb } from '@/lib/admin-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Admin-only notification analytics
export async function GET() {
  const session = await requireAdminFromDb();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

  try {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalNotifications,
      unreadCount,
      last24h,
      last7d,
      byCategory,
      recent
    ] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { read: false } }),
      prisma.notification.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.notification.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.notification.groupBy({
        by: ['category'],
        _count: { id: true },
      }),
      prisma.notification.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } }
        }
      })
    ]);

    const categoryStats = byCategory.map((c: { category: string; _count: { id: number } }) => ({
      category: c.category,
      count: c._count.id
    }));

    return NextResponse.json({
      total: totalNotifications,
      unread: unreadCount,
      last24h,
      last7d,
      byCategory: categoryStats,
      recent: recent.map((n: (typeof recent)[number]) => ({
        id: n.id,
        user: n.user?.name || n.user?.email || 'Unknown',
        title: n.title,
        message: n.message,
        category: n.category,
        createdAt: n.createdAt,
        read: n.read,
        link: n.link,
        emailStatus: n.emailStatus,
        pushStatus: n.pushStatus,
      }))
    });
  } catch (error) {
    console.error('Admin notification stats error:', error);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
