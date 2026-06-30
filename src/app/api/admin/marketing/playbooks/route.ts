import { NextResponse } from 'next/server';
import { requireAdminPanelSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import {
  countReachableAudience,
  isNotificationPreferenceDrift,
  isUserEmailReachable,
} from '@/lib/marketing-audience';
import { MARKETING_PLAYBOOKS } from '@/lib/marketing-playbooks';

export async function GET() {
  try {
    const session = await requireAdminPanelSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const playbooks = await Promise.all(
      MARKETING_PLAYBOOKS.map(async (playbook) => {
        const where = playbook.buildWhere();
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
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 3,
          }),
        ]);

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
          roleFilter: playbook.roleFilter,
          segment: playbook.segment,
          defaultCta: playbook.defaultCta,
          defaultCtaUrl: playbook.defaultCtaUrl,
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

    return NextResponse.json({ playbooks });
  } catch (error) {
    console.error('Marketing playbooks error:', error);
    return NextResponse.json({ error: 'Failed to load playbooks' }, { status: 500 });
  }
}