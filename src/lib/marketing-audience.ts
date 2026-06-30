import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { buildPlaybookWhere, parsePlaybookId } from '@/lib/marketing-playbooks';

export type MarketingRecipient = {
  id: string;
  email: string | null;
  name: string | null;
  businessName?: string | null;
  city?: string | null;
};

const ACTIVE_LOGIN_DAYS = 30;
const BROADCAST_RECIPIENT_CAP = 5000;

function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

export function isMissingMarketingCampaignTable(err: unknown): boolean {
  const code = typeof err === 'object' && err !== null && 'code' in err
    ? String((err as { code?: string }).code)
    : '';
  const msg = err instanceof Error ? err.message : String(err);
  return (
    code === 'P2021' ||
    (msg.includes('MarketingCampaign') &&
      (msg.includes('does not exist') || msg.includes('P2021')))
  );
}

export function isNotificationPreferenceDrift(err: unknown): boolean {
  const code = typeof err === 'object' && err !== null && 'code' in err
    ? String((err as { code?: string }).code)
    : '';
  const msg = err instanceof Error ? err.message : String(err);
  return (
    code === 'P2021' ||
    code === 'P2022' ||
    msg.includes('NotificationPreference') ||
    msg.includes('notificationPreferences')
  );
}

export function buildAudienceWhere(
  segment: string,
  city?: string,
  search?: string,
): Prisma.UserWhereInput {
  const seg = (segment || 'all').toLowerCase();
  const playbookId = parsePlaybookId(seg);
  if (playbookId) {
    const playbookWhere = buildPlaybookWhere(playbookId);
    if (playbookWhere) {
      const where: Prisma.UserWhereInput = { ...playbookWhere };
      if (city) {
        where.city = { contains: city, mode: 'insensitive' } as Prisma.StringNullableFilter;
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } as Prisma.StringNullableFilter },
          { email: { contains: search, mode: 'insensitive' } as Prisma.StringNullableFilter },
          { businessName: { contains: search, mode: 'insensitive' } as Prisma.StringNullableFilter },
        ];
      }
      return where;
    }
  }

  const where: Prisma.UserWhereInput = {
    email: { not: null },
    isActive: true,
  };
  if (seg === 'buyers') where.role = 'buyer';
  if (seg === 'sellers') where.role = 'seller';
  if (seg === 'admins') where.role = 'admin';
  if (seg === 'inactive') where.isActive = false;
  if (seg === 'active') {
    where.lastLoginAt = { gte: subDays(new Date(), ACTIVE_LOGIN_DAYS) };
  }

  if (city) {
    where.city = { contains: city, mode: 'insensitive' } as Prisma.StringNullableFilter;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } as Prisma.StringNullableFilter },
      { email: { contains: search, mode: 'insensitive' } as Prisma.StringNullableFilter },
      { businessName: { contains: search, mode: 'insensitive' } as Prisma.StringNullableFilter },
    ];
  }

  return where;
}

export function isUserEmailReachable(
  user: { email: string | null },
  pref?: { emailEnabled: boolean } | null,
): boolean {
  if (!user.email) return false;
  if (!pref) return true;
  return pref.emailEnabled !== false;
}

/** Resolve marketing recipients with preference filters applied. */
export async function resolveMarketingRecipients(opts: {
  userIds?: string[];
  where?: Prisma.UserWhereInput;
  take?: number;
}): Promise<MarketingRecipient[]> {
  const { userIds, where, take = BROADCAST_RECIPIENT_CAP } = opts;

  let baseUsers: MarketingRecipient[];

  if (userIds && userIds.length > 0) {
    baseUsers = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        email: { not: null },
        isActive: true,
      },
      select: { id: true, email: true, name: true, businessName: true, city: true },
    });
  } else if (where) {
    baseUsers = await prisma.user.findMany({
      where,
      select: { id: true, email: true, name: true, businessName: true, city: true },
      orderBy: { createdAt: 'desc' },
      take,
    });
  } else {
    return [];
  }

  const ids = baseUsers.map((u) => u.id);
  if (ids.length === 0) return [];

  try {
    const prefs = await prisma.notificationPreference.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, emailEnabled: true },
    });
    const prefMap = new Map<string, { userId: string; emailEnabled: boolean }>(
      prefs.map((p: { userId: string; emailEnabled: boolean }) => [p.userId, p]),
    );

    return baseUsers.filter((u) => {
      if (!u.email) return false;
      const p = prefMap.get(u.id);
      if (!p) return true;
      return p.emailEnabled !== false;
    });
  } catch (err) {
    if (isNotificationPreferenceDrift(err)) {
      console.warn('NotificationPreference unavailable; defaulting all recipients to reachable.');
      return baseUsers.filter((u) => !!u.email);
    }
    throw err;
  }
}

export function formatBroadcastSegment(opts: {
  testOnly?: boolean;
  userIds?: string[];
  recipients: MarketingRecipient[];
  segment?: string;
  city?: string;
}): string {
  const { testOnly, userIds, recipients, segment = 'all', city } = opts;
  if (testOnly) return 'test-only';
  if (userIds && userIds.length === 1 && recipients[0]?.email) {
    return `user:${recipients[0].email}`;
  }
  if (userIds && userIds.length > 1) {
    return `users:${userIds.length}`;
  }
  return city ? `${segment}+city:${city}` : segment;
}

/** Users matching filters minus those who explicitly disabled email notifications. */
export async function countReachableAudience(where: Prisma.UserWhereInput): Promise<number> {
  const total = await prisma.user.count({ where });

  try {
    const emailDisabled = await prisma.user.count({
      where: {
        ...where,
        notificationPreferences: {
          is: { emailEnabled: false },
        },
      },
    });
    return Math.max(0, total - emailDisabled);
  } catch (err) {
    if (isNotificationPreferenceDrift(err)) {
      console.warn('NotificationPreference unavailable; defaulting reachable count to total.');
      return total;
    }
    throw err;
  }
}