import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPanelSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { buildCityWhere, isCountryCodeSchemaDrift, withoutCountryCode } from '@/lib/colombia-geo';
import {
  countReachableAudience,
  getBuyerFunnelStats,
  isNotificationPreferenceDrift,
  isUserEmailReachable,
} from '@/lib/marketing-audience';
import { MARKETING_PLAYBOOKS } from '@/lib/marketing-playbooks';
import type { Prisma } from '@prisma/client';

function applyCityToWhere(where: Prisma.UserWhereInput, city?: string): Prisma.UserWhereInput {
  if (!city?.trim()) return where;
  const cityWhere = buildCityWhere(city);
  if (!cityWhere) return where;
  return {
    AND: [where, cityWhere],
  };
}

async function safePlaybookCounts(where: Prisma.UserWhereInput) {
  try {
    const [total, reachable] = await Promise.all([
      prisma.user.count({ where }),
      countReachableAudience(where),
    ]);
    return { total, reachable };
  } catch (err) {
    if (isCountryCodeSchemaDrift(err)) {
      const fallbackWhere = withoutCountryCode(where);
      const [total, reachable] = await Promise.all([
        prisma.user.count({ where: fallbackWhere }),
        countReachableAudience(fallbackWhere),
      ]);
      return { total, reachable };
    }
    throw err;
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminPanelSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const city = new URL(req.url).searchParams.get('city') || '';

    let buyerFunnel = { totalBuyers: 0, noOrders: 0, onePlusOrders: 0, repeatBuyers: 0 };
    try {
      buyerFunnel = await getBuyerFunnelStats(city || undefined);
    } catch (err) {
      console.error('Buyer funnel stats failed:', err);
    }

    const playbooks = await Promise.all(
      MARKETING_PLAYBOOKS.map(async (playbook) => {
        const where = applyCityToWhere(playbook.buildWhere(), city);

        let total = 0;
        let reachable = 0;
        let sample: Array<{
          id: string;
          name: string | null;
          email: string | null;
          role: string;
          businessName: string | null;
          city: string | null;
          createdAt: Date;
        }> = [];

        try {
          const counts = await safePlaybookCounts(where);
          total = counts.total;
          reachable = counts.reachable;
          sample = await prisma.user.findMany({
            where,
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              businessName: true,
              city: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 3,
          });
        } catch (err) {
          if (isCountryCodeSchemaDrift(err)) {
            const fallbackWhere = withoutCountryCode(where);
            const counts = await safePlaybookCounts(fallbackWhere);
            total = counts.total;
            reachable = counts.reachable;
          } else {
            console.error(`Playbook count failed (${playbook.id}):`, err);
          }
        }

        type SampleUser = (typeof sample)[number];
        const sampleIds = sample.map((u: SampleUser) => u.id);
        let prefMap = new Map<string, { emailEnabled: boolean }>();

        if (sampleIds.length > 0) {
          try {
            const prefs = await prisma.notificationPreference.findMany({
              where: { userId: { in: sampleIds } },
              select: { userId: true, emailEnabled: true },
            });
            prefMap = new Map(
              prefs.map((p: { userId: string; emailEnabled: boolean }) => [p.userId, p]),
            );
          } catch (err) {
            if (!isNotificationPreferenceDrift(err)) throw err;
          }
        }

        return {
          id: playbook.id,
          label: playbook.label,
          description: playbook.description,
          category: playbook.category,
          roleFilter: playbook.roleFilter,
          segment: playbook.segment,
          defaultCta: playbook.defaultCta,
          defaultCtaUrl: playbook.defaultCtaUrl,
          automatable: playbook.automatable ?? false,
          total,
          reachable,
          sample: sample.map((u: SampleUser) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            businessName: u.businessName,
            city: u.city,
            emailReachable: isUserEmailReachable(u, prefMap.get(u.id)),
          })),
        };
      }),
    );

    return NextResponse.json({ playbooks, buyerFunnel, cityFilter: city || null });
  } catch (error) {
    console.error('Marketing playbooks error:', error);
    return NextResponse.json({ error: 'Failed to load playbooks' }, { status: 500 });
  }
}