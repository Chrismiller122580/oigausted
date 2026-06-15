import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

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
  const where: Prisma.UserWhereInput = {
    email: { not: null },
    isActive: true,
  };

  const seg = (segment || 'all').toLowerCase();
  if (seg === 'buyers') where.role = 'buyer';
  if (seg === 'sellers') where.role = 'seller';
  if (seg === 'admins') where.role = 'admin';
  if (seg === 'inactive') where.isActive = false;

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