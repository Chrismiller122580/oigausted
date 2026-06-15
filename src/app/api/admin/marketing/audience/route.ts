import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  buildAudienceWhere,
  countReachableAudience,
  isNotificationPreferenceDrift,
} from '@/lib/marketing-audience';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const segment = searchParams.get('segment') || 'all';
    const city = searchParams.get('city') || '';
    const search = searchParams.get('search') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

    const where = buildAudienceWhere(segment, city, search);

    const [total, reachable, sample] = await Promise.all([
      prisma.user.count({ where }),
      countReachableAudience(where),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          businessName: true,
          city: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    return NextResponse.json({
      total,
      reachable,
      sample: sample.map((u: (typeof sample)[number]) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        businessName: u.businessName,
        city: u.city,
        isActive: u.isActive,
        createdAt: u.createdAt,
      })),
      segment,
      filters: { city, search },
    });
  } catch (error) {
    if (isNotificationPreferenceDrift(error)) {
      console.warn('Marketing audience prefs drift; returning empty audience until migration deploys.');
      return NextResponse.json({
        total: 0,
        reachable: 0,
        sample: [],
        segment: 'all',
        filters: { city: '', search: '' },
        tableMissing: true,
      });
    }
    console.error('Marketing audience error:', error);
    return NextResponse.json({ error: 'Failed to compute audience' }, { status: 500 });
  }
}