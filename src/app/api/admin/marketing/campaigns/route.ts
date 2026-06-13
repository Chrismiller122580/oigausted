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
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // @ts-ignore - MarketingCampaign model is new; run prisma generate + migrate
    const [campaigns, total] = await Promise.all([
      (prisma as any).marketingCampaign.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          sentBy: { select: { id: true, name: true, email: true } },
        },
        take: limit,
        skip: offset,
      }),
      (prisma as any).marketingCampaign.count(),
    ]);

    return NextResponse.json({
      campaigns: (campaigns || []).map((c: any) => ({
        id: c.id,
        subject: c.subject,
        segment: c.segment,
        recipientCount: c.recipientCount,
        sentBy: c.sentBy ? (c.sentBy.name || c.sentBy.email) : 'System',
        sentById: c.sentById,
        createdAt: c.createdAt,
      })),
      total: total || 0,
      hasMore: offset + (campaigns?.length || 0) < (total || 0),
    });
  } catch (error) {
    console.error('Marketing campaigns list error:', error);
    return NextResponse.json({ error: 'Failed to load campaigns' }, { status: 500 });
  }
}
