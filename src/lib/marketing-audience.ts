import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import {
  buildCityWhere,
  colombiaUserFilter,
  isCountryCodeSchemaDrift,
  withoutCountryCode,
} from '@/lib/colombia-geo';
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

function applyCityFilter(where: Prisma.UserWhereInput, city?: string): void {
  if (!city?.trim()) return;
  const cityWhere = buildCityWhere(city);
  if (cityWhere) {
    where.AND = Array.isArray(where.AND)
      ? [...where.AND, cityWhere]
      : where.AND
        ? [where.AND, cityWhere]
        : [cityWhere];
  }
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
      const where: Prisma.UserWhereInput = {
        ...playbookWhere,
        ...colombiaUserFilter(),
      };
      applyCityFilter(where, city);
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
    ...colombiaUserFilter(),
  };
  if (seg === 'buyers') where.role = 'buyer';
  if (seg === 'sellers') where.role = 'seller';
  if (seg === 'admins') where.role = 'admin';
  if (seg === 'inactive') where.isActive = false;
  if (seg === 'active') {
    where.lastLoginAt = { gte: subDays(new Date(), ACTIVE_LOGIN_DAYS) };
  }

  applyCityFilter(where, city);

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } as Prisma.StringNullableFilter },
      { email: { contains: search, mode: 'insensitive' } as Prisma.StringNullableFilter },
      { businessName: { contains: search, mode: 'insensitive' } as Prisma.StringNullableFilter },
    ];
  }

  return where;
}

type PrefRow = { emailEnabled?: boolean; marketingEmails?: boolean };

export function isUserEmailReachable(
  user: { email: string | null },
  pref?: PrefRow | null,
): boolean {
  if (!user.email) return false;
  if (!pref) return true;
  if (pref.emailEnabled === false) return false;
  if (pref.marketingEmails === false) return false;
  return true;
}

function isMarketingReachable(pref?: PrefRow | null): boolean {
  if (!pref) return true;
  if (pref.emailEnabled === false) return false;
  if (pref.marketingEmails === false) return false;
  return true;
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
        ...colombiaUserFilter(),
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
    const prefMap = new Map<string, PrefRow>(
      prefs.map((p: { userId: string; emailEnabled: boolean }) => [p.userId, p]),
    );

    return baseUsers.filter((u) => {
      if (!u.email) return false;
      return isMarketingReachable(prefMap.get(u.id));
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

async function countUsersSafe(where: Prisma.UserWhereInput): Promise<number> {
  try {
    return await prisma.user.count({ where });
  } catch (err) {
    if (isCountryCodeSchemaDrift(err)) {
      return prisma.user.count({ where: withoutCountryCode(where) });
    }
    throw err;
  }
}

/** Users matching filters minus those who opted out of marketing emails. */
export async function countReachableAudience(where: Prisma.UserWhereInput): Promise<number> {
  const total = await countUsersSafe(where);

  try {
    const emailDisabled = await prisma.user.count({
      where: {
        ...where,
        notificationPreferences: {
          is: { emailEnabled: false },
        },
      },
    });
    let marketingDisabled = 0;
    try {
      marketingDisabled = await prisma.user.count({
        where: {
          ...where,
          notificationPreferences: {
            is: { marketingEmails: false },
          },
        },
      });
    } catch {
      // marketingEmails column may not exist in all environments
    }
    return Math.max(0, total - Math.max(emailDisabled, marketingDisabled));
  } catch (err) {
    if (isNotificationPreferenceDrift(err)) {
      console.warn('NotificationPreference unavailable; defaulting reachable count to total.');
      return total;
    }
    throw err;
  }
}

/** Buyer funnel stats for marketing dashboard. */
export async function getBuyerFunnelStats(city?: string): Promise<{
  totalBuyers: number;
  noOrders: number;
  onePlusOrders: number;
  repeatBuyers: number;
}> {
  const base: Prisma.UserWhereInput = {
    role: 'buyer',
    isActive: true,
    ...colombiaUserFilter(),
  };
  applyCityFilter(base, city);

  const [totalBuyers, noOrders, onePlusOrders, repeatBuyers] = await Promise.all([
    countUsersSafe(base),
    countUsersSafe({ ...base, ordersAsBuyer: { none: {} } }),
    countUsersSafe({
      ...base,
      ordersAsBuyer: { some: { status: 'Completed' } },
    }),
    (async () => {
      try {
        const buyers = await prisma.user.findMany({
          where: {
            ...base,
            ordersAsBuyer: { some: { status: 'Completed' } },
          },
          select: {
            _count: { select: { ordersAsBuyer: { where: { status: 'Completed' } } } },
          },
        });
        return buyers.filter((b: { _count: { ordersAsBuyer: number } }) => b._count.ordersAsBuyer >= 2).length;
      } catch (err) {
        if (isCountryCodeSchemaDrift(err)) {
          const fallbackBase = withoutCountryCode(base);
          const buyers = await prisma.user.findMany({
            where: {
              ...fallbackBase,
              ordersAsBuyer: { some: { status: 'Completed' } },
            },
            select: {
              _count: { select: { ordersAsBuyer: { where: { status: 'Completed' } } } },
            },
          });
          return buyers.filter((b: { _count: { ordersAsBuyer: number } }) => b._count.ordersAsBuyer >= 2).length;
        }
        throw err;
      }
    })(),
  ]);

  return { totalBuyers, noOrders, onePlusOrders, repeatBuyers };
}