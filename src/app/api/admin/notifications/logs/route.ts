import { NextRequest, NextResponse } from 'next/server';
import { requireAdminFromDb } from '@/lib/admin-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

// GET /api/admin/notifications/logs
// Advanced filtering for notification logs (2027-grade admin tooling)
export async function GET(req: NextRequest) {
  const session = await requireAdminFromDb();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

  const { searchParams } = new URL(req.url);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const emailStatus = searchParams.get('emailStatus') || '';
  const pushStatus = searchParams.get('pushStatus') || '';
  const read = searchParams.get('read');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const where: Prisma.NotificationWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { message: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }

    if (category) where.category = category;
    if (emailStatus) where.emailStatus = emailStatus;
    if (pushStatus) where.pushStatus = pushStatus;
    if (read === 'true') where.read = true;
    if (read === 'false') where.read = false;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [logs, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
    ]);

    return NextResponse.json({
      logs: logs.map((n: (typeof logs)[number]) => ({
        id: n.id,
        userId: n.userId,
        userName: n.user?.name || n.user?.email || 'Unknown',
        title: n.title,
        message: n.message,
        category: n.category,
        link: n.link,
        read: n.read,
        createdAt: n.createdAt,
        emailStatus: n.emailStatus,
        emailSentAt: n.emailSentAt,
        emailOpenedAt: n.emailOpenedAt,
        pushStatus: n.pushStatus,
        pushSentAt: n.pushSentAt,
        pushClickedAt: n.pushClickedAt,
        data: n.data,
        deliveryLog: n.deliveryLog,
      })),
      total,
      hasMore: offset + logs.length < total,
    });
  } catch (error) {
    console.error('Admin logs error:', error);
    return NextResponse.json({ error: 'Failed to load logs' }, { status: 500 });
  }
}
