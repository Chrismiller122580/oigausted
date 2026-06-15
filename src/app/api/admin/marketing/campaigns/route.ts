import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function isMissingMarketingCampaignTable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('MarketingCampaign') &&
    (msg.includes('does not exist') || msg.includes('P2021'))
  );
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const [campaigns, total] = await Promise.all([
      prisma.marketingCampaign.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          sentBy: { select: { id: true, name: true, email: true } },
        },
        take: limit,
        skip: offset,
      }),
      prisma.marketingCampaign.count(),
    ]);

    return NextResponse.json({
      campaigns: (campaigns || []).map((c: (typeof campaigns)[number]) => ({
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
    if (isMissingMarketingCampaignTable(error)) {
      console.warn('MarketingCampaign table missing; returning empty history until migration deploys.');
      return NextResponse.json({
        campaigns: [],
        total: 0,
        hasMore: false,
        tableMissing: true,
      });
    }
    console.error('Marketing campaigns list error:', error);
    return NextResponse.json({ error: 'Failed to load campaigns' }, { status: 500 });
  }
}
