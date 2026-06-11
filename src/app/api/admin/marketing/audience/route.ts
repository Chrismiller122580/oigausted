import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const segment = searchParams.get('segment') || 'all';
  const city = searchParams.get('city') || '';
  const search = searchParams.get('search') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

  try {
    const where: any = {
      email: { not: null },
      isActive: true, // only active accounts by default for marketing
    };

    // Role / segment parsing
    if (segment === 'buyers') where.role = 'buyer';
    if (segment === 'sellers') where.role = 'seller';
    if (segment === 'admins') where.role = 'admin';
    // 'active' is already defaulted above via isActive
    if (segment === 'inactive') where.isActive = false;

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, sample] = await Promise.all([
      prisma.user.count({ where }),
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

    // Compute rough "email reachable" count.
    // Select ONLY stable columns (omit marketingEmails entirely) to avoid "column does not exist" on drifted prod DBs.
    // Default: if no pref row or marketingEmails not readable, treat as allowed (matches @default(true) in schema).
    const usersForReachable = await prisma.user.findMany({
      where,
      select: {
        id: true,
        notificationPreferences: { select: { userId: true, emailEnabled: true } },
      },
      take: 10000,
    });

    const reachable = usersForReachable.filter((u: any) => {
      const p = u.notificationPreferences;
      if (!p) return true;
      if (p.emailEnabled === false) return false;
      // marketingEmails omitted from query for drift safety; default allow (true)
      return true;
    }).length;

    return NextResponse.json({
      total,
      reachable,
      sample: sample.map((u: any) => ({
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
    console.error('Marketing audience error:', error);
    return NextResponse.json({ error: 'Failed to compute audience' }, { status: 500 });
  }
}
