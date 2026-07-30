import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPanelSession, requireAnalyticsPanelSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import {
  buildAudienceWhere,
  countReachableAudience,
  isNotificationPreferenceDrift,
  isUserEmailReachable,
  resolveAudienceWhere,
  type AudienceGeoScope,
  type AudiencePrefMode,
} from '@/lib/marketing-audience';

export async function GET(req: NextRequest) {
  try {
    const session =
      (await requireAnalyticsPanelSession()) ?? (await requireAdminPanelSession());
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const segment = searchParams.get('segment') || 'all';
    const city = searchParams.get('city') || '';
    const search = searchParams.get('search') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const geoScope: AudienceGeoScope =
      searchParams.get('geoScope') === 'all' ? 'all' : 'colombia';
    const prefMode: AudiencePrefMode =
      searchParams.get('mode') === 'ops' || searchParams.get('mode') === 'system'
        ? 'ops'
        : 'marketing';

    const rawWhere = buildAudienceWhere(segment, { city, search, geoScope });
    const where = await resolveAudienceWhere(rawWhere);

    const [total, reachable, sample] = await Promise.all([
      prisma.user.count({ where }),
      countReachableAudience(where, prefMode),
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

    type SampleUser = (typeof sample)[number];
    const sampleIds = sample.map((u: SampleUser) => u.id);
    let prefMap = new Map<string, { emailEnabled: boolean; marketingEmails?: boolean }>();

    if (sampleIds.length > 0) {
      try {
        try {
          const prefs = await prisma.notificationPreference.findMany({
            where: { userId: { in: sampleIds } },
            select: { userId: true, emailEnabled: true, marketingEmails: true },
          });
          prefMap = new Map(
            prefs.map(
              (p: {
                userId: string;
                emailEnabled: boolean;
                marketingEmails?: boolean;
              }) => [p.userId, p]
            )
          );
        } catch {
          const prefs = await prisma.notificationPreference.findMany({
            where: { userId: { in: sampleIds } },
            select: { userId: true, emailEnabled: true },
          });
          prefMap = new Map(
            prefs.map((p: { userId: string; emailEnabled: boolean }) => [p.userId, p])
          );
        }
      } catch (err) {
        if (!isNotificationPreferenceDrift(err)) throw err;
      }
    }

    return NextResponse.json({
      total,
      reachable,
      sample: sample.map((u: SampleUser) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        businessName: u.businessName,
        city: u.city,
        isActive: u.isActive,
        createdAt: u.createdAt,
        emailReachable: isUserEmailReachable(u, prefMap.get(u.id), prefMode),
      })),
      segment,
      filters: { city, search, geoScope, mode: prefMode },
    });
  } catch (error) {
    if (isNotificationPreferenceDrift(error)) {
      console.warn(
        'Marketing audience prefs drift; returning empty audience until migration deploys.'
      );
      return NextResponse.json({
        total: 0,
        reachable: 0,
        sample: [],
        segment: 'all',
        filters: { city: '', search: '', geoScope: 'colombia', mode: 'marketing' },
        tableMissing: true,
      });
    }
    console.error('Marketing audience error:', error);
    return NextResponse.json({ error: 'Failed to compute audience' }, { status: 500 });
  }
}
