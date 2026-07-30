import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import {
  buildCityWhere,
  colombiaUserFilter,
  isCountryCodeSchemaDrift,
  stringContains,
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

/** Search must be AND-ed so it never overwrites playbook OR clauses (e.g. sellers-no-payout). */
function applySearchFilter(where: Prisma.UserWhereInput, search?: string): void {
  if (!search?.trim()) return;
  const q = search.trim();
  const searchWhere: Prisma.UserWhereInput = {
    OR: [
      { name: stringContains(q) },
      { email: stringContains(q) },
      { businessName: stringContains(q) },
    ],
  };
  where.AND = Array.isArray(where.AND)
    ? [...where.AND, searchWhere]
    : where.AND
      ? [where.AND, searchWhere]
      : [searchWhere];
}

/** Geographic audience scope for broadcasts. */
export type AudienceGeoScope = 'colombia' | 'all';

/** Pref filter mode: marketing honors marketingEmails opt-out; ops only needs emailEnabled. */
export type AudiencePrefMode = 'marketing' | 'ops';

export type BuildAudienceOptions = {
  city?: string;
  search?: string;
  /** Default: colombia. Use "all" for multi-country / full platform. */
  geoScope?: AudienceGeoScope;
};

export function buildAudienceWhere(
  segment: string,
  cityOrOpts?: string | BuildAudienceOptions,
  search?: string,
): Prisma.UserWhereInput {
  const opts: BuildAudienceOptions =
    typeof cityOrOpts === 'string' || cityOrOpts === undefined
      ? { city: cityOrOpts, search }
      : cityOrOpts;

  const city = opts.city;
  const searchTerm = opts.search ?? search;
  const geoScope: AudienceGeoScope = opts.geoScope === 'all' ? 'all' : 'colombia';
  const geoFilter = geoScope === 'colombia' ? colombiaUserFilter() : {};

  const seg = (segment || 'all').toLowerCase();
  const playbookId = parsePlaybookId(seg);
  if (playbookId) {
    const playbookWhere = buildPlaybookWhere(playbookId);
    if (playbookWhere) {
      const where: Prisma.UserWhereInput = {
        ...playbookWhere,
        ...geoFilter,
      };
      applyCityFilter(where, city);
      applySearchFilter(where, searchTerm);
      return where;
    }
  }

  const where: Prisma.UserWhereInput = {
    email: { not: null },
    isActive: true,
    ...geoFilter,
  };
  if (seg === 'buyers') where.role = 'buyer';
  if (seg === 'sellers') where.role = 'seller';
  if (seg === 'admins') where.role = 'admin';
  if (seg === 'inactive') where.isActive = false;
  if (seg === 'active') {
    where.lastLoginAt = { gte: subDays(new Date(), ACTIVE_LOGIN_DAYS) };
  }

  applyCityFilter(where, city);
  applySearchFilter(where, searchTerm);

  return where;
}

type PrefRow = { emailEnabled?: boolean; marketingEmails?: boolean };

export function isUserEmailReachable(
  user: { email: string | null },
  pref?: PrefRow | null,
  mode: AudiencePrefMode = 'marketing',
): boolean {
  if (!user.email) return false;
  if (!pref) return true;
  if (pref.emailEnabled === false) return false;
  if (mode === 'marketing' && pref.marketingEmails === false) return false;
  return true;
}

function isReachableForMode(pref: PrefRow | undefined | null, mode: AudiencePrefMode): boolean {
  if (!pref) return true;
  if (pref.emailEnabled === false) return false;
  if (mode === 'marketing' && pref.marketingEmails === false) return false;
  return true;
}

/** Resolve broadcast recipients with preference filters applied. */
export async function resolveMarketingRecipients(opts: {
  userIds?: string[];
  where?: Prisma.UserWhereInput;
  take?: number;
  /** marketing (default) or ops (system announcements; ignore marketingEmails opt-out) */
  prefMode?: AudiencePrefMode;
  geoScope?: AudienceGeoScope;
}): Promise<MarketingRecipient[]> {
  const {
    userIds,
    where,
    take = BROADCAST_RECIPIENT_CAP,
    prefMode = 'marketing',
    geoScope = 'colombia',
  } = opts;

  const geoFilter = geoScope === 'colombia' ? colombiaUserFilter() : {};

  let baseUsers: MarketingRecipient[];

  if (userIds && userIds.length > 0) {
    const idWhere = await resolveAudienceWhere({
      id: { in: userIds },
      email: { not: null },
      isActive: true,
      ...geoFilter,
    });
    baseUsers = await prisma.user.findMany({
      where: idWhere,
      select: { id: true, email: true, name: true, businessName: true, city: true },
    });
  } else if (where) {
    const effectiveWhere = await resolveAudienceWhere(where);
    baseUsers = await prisma.user.findMany({
      where: effectiveWhere,
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
    // Prefer full prefs (email + marketing opt-out). Fall back if marketingEmails column is missing (schema drift).
    let prefs: Array<{ userId: string; emailEnabled: boolean; marketingEmails?: boolean }>;
    try {
      prefs = await prisma.notificationPreference.findMany({
        where: { userId: { in: ids } },
        select: { userId: true, emailEnabled: true, marketingEmails: true },
      });
    } catch (selectErr) {
      if (!isNotificationPreferenceDrift(selectErr)) throw selectErr;
      console.warn(
        'NotificationPreference.marketingEmails unavailable; filtering on emailEnabled only.',
      );
      prefs = await prisma.notificationPreference.findMany({
        where: { userId: { in: ids } },
        select: { userId: true, emailEnabled: true },
      });
    }

    const prefMap = new Map<string, PrefRow>(
      prefs.map((p) => [
        p.userId,
        {
          emailEnabled: p.emailEnabled,
          ...(p.marketingEmails !== undefined ? { marketingEmails: p.marketingEmails } : {}),
        },
      ]),
    );

    return baseUsers.filter((u) => {
      if (!u.email) return false;
      return isReachableForMode(prefMap.get(u.id), prefMode);
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
  mode?: AudiencePrefMode;
  geoScope?: AudienceGeoScope;
}): string {
  const {
    testOnly,
    userIds,
    recipients,
    segment = 'all',
    city,
    mode = 'marketing',
    geoScope = 'colombia',
  } = opts;
  if (testOnly) return mode === 'ops' ? 'ops:test-only' : 'test-only';
  if (userIds && userIds.length === 1 && recipients[0]?.email) {
    return `${mode === 'ops' ? 'ops:' : ''}user:${recipients[0].email}`;
  }
  if (userIds && userIds.length > 1) {
    return `${mode === 'ops' ? 'ops:' : ''}users:${userIds.length}`;
  }
  const base = city ? `${segment}+city:${city}` : segment;
  const parts = [mode === 'ops' ? `ops:${base}` : base];
  if (geoScope === 'all') parts.push('geo:all');
  return parts.join('+');
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

/**
 * Resolve a where clause that works against the live schema.
 * Strips countryCode when that column is missing in production.
 */
export async function resolveAudienceWhere(
  where: Prisma.UserWhereInput,
): Promise<Prisma.UserWhereInput> {
  try {
    await prisma.user.count({ where });
    return where;
  } catch (err) {
    if (isCountryCodeSchemaDrift(err)) {
      return withoutCountryCode(where);
    }
    throw err;
  }
}

/**
 * Users matching filters minus those who opted out of email (and marketing, when mode=marketing).
 * Note: uses separate counts (not a perfect set-union) as a fast approximation for the dashboard.
 */
export async function countReachableAudience(
  where: Prisma.UserWhereInput,
  prefMode: AudiencePrefMode = 'marketing',
): Promise<number> {
  const effectiveWhere = await resolveAudienceWhere(where);
  const total = await prisma.user.count({ where: effectiveWhere });

  try {
    const emailDisabled = await prisma.user.count({
      where: {
        ...effectiveWhere,
        notificationPreferences: {
          is: { emailEnabled: false },
        },
      },
    });
    let marketingDisabled = 0;
    if (prefMode === 'marketing') {
      try {
        marketingDisabled = await prisma.user.count({
          where: {
            ...effectiveWhere,
            notificationPreferences: {
              is: { marketingEmails: false },
            },
          },
        });
      } catch {
        // marketingEmails column may not exist in all environments
      }
    }
    // Approximation: subtract the larger single opt-out bucket (avoids double-count complexity)
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