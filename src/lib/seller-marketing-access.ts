import { prisma, getPlatformConfig } from '@/lib/prisma';
import { loadSellerMarketingContext } from '@/lib/seller-marketing-context';
import type { NextRequest } from 'next/server';

export type MarketingAdminOverride = 'pro' | 'free' | 'blocked' | null;

export type SellerMarketingAccess = {
  allowed: boolean;
  blockedReason?: string;
  tier: 'free' | 'pro';
  effectiveTier: 'free' | 'pro';
  usedThisMonth: number;
  limit: number | null;
  canGenerate: boolean;
  expiresAt: string | null;
  enabled: boolean;
  adminOverride: MarketingAdminOverride;
  adminNote: string | null;
  storeUrl: string;
  storePath: string;
  isUnlimited: boolean;
};

function monthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

async function countGenerationsThisMonth(userId: string): Promise<number> {
  try {
    return await prisma.sellerMarketingGeneration.count({
      where: { userId, createdAt: { gte: monthStart() } },
    });
  } catch {
    return 0;
  }
}

export async function ensureMarketingSubscription(userId: string) {
  try {
    return await prisma.sellerMarketingSubscription.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  } catch {
    return null;
  }
}

export async function getSellerMarketingAccess(
  userId: string,
  opts?: { isAdmin?: boolean; req?: NextRequest },
): Promise<SellerMarketingAccess> {
  const ctx = await loadSellerMarketingContext(userId, null, opts?.req);
  const storeUrl = ctx?.storeUrl ?? '';
  const storePath = ctx?.storePath ?? '';

  if (opts?.isAdmin) {
    return {
      allowed: true,
      tier: 'pro',
      effectiveTier: 'pro',
      usedThisMonth: 0,
      limit: null,
      canGenerate: true,
      expiresAt: null,
      enabled: true,
      adminOverride: null,
      adminNote: null,
      storeUrl,
      storePath,
      isUnlimited: true,
    };
  }

  const config = await getPlatformConfig();
  const freeLimit = config.marketingStudioFreeMonthlyLimit ?? 3;

  const sub = await ensureMarketingSubscription(userId);
  const usedThisMonth = await countGenerationsThisMonth(userId);

  if (!sub) {
    return {
      allowed: true,
      tier: 'free',
      effectiveTier: 'free',
      usedThisMonth,
      limit: freeLimit,
      canGenerate: usedThisMonth < freeLimit,
      expiresAt: null,
      enabled: true,
      adminOverride: null,
      adminNote: null,
      storeUrl,
      storePath,
      isUnlimited: false,
    };
  }

  const enabled = sub.enabled !== false;
  const adminOverride = (sub.adminOverride as MarketingAdminOverride) ?? null;
  const adminNote = sub.adminNote ?? null;
  const expiresAt = sub.expiresAt;
  const paidPro = sub.tier === 'pro' && expiresAt && expiresAt > new Date();

  if (!enabled || adminOverride === 'blocked') {
    return {
      allowed: false,
      blockedReason: 'Estudio de Marketing desactivado por el administrador.',
      tier: sub.tier as 'free' | 'pro',
      effectiveTier: 'free',
      usedThisMonth,
      limit: freeLimit,
      canGenerate: false,
      expiresAt: expiresAt?.toISOString() ?? null,
      enabled,
      adminOverride,
      adminNote,
      storeUrl,
      storePath,
      isUnlimited: false,
    };
  }

  if (adminOverride === 'pro') {
    return {
      allowed: true,
      tier: 'pro',
      effectiveTier: 'pro',
      usedThisMonth,
      limit: null,
      canGenerate: true,
      expiresAt: expiresAt?.toISOString() ?? null,
      enabled,
      adminOverride,
      adminNote,
      storeUrl,
      storePath,
      isUnlimited: true,
    };
  }

  if (adminOverride === 'free') {
    return {
      allowed: true,
      tier: 'free',
      effectiveTier: 'free',
      usedThisMonth,
      limit: freeLimit,
      canGenerate: usedThisMonth < freeLimit,
      expiresAt: expiresAt?.toISOString() ?? null,
      enabled,
      adminOverride,
      adminNote,
      storeUrl,
      storePath,
      isUnlimited: false,
    };
  }

  if (paidPro) {
    return {
      allowed: true,
      tier: 'pro',
      effectiveTier: 'pro',
      usedThisMonth,
      limit: null,
      canGenerate: true,
      expiresAt: expiresAt.toISOString(),
      enabled,
      adminOverride,
      adminNote,
      storeUrl,
      storePath,
      isUnlimited: true,
    };
  }

  return {
    allowed: true,
    tier: 'free',
    effectiveTier: 'free',
    usedThisMonth,
    limit: freeLimit,
    canGenerate: usedThisMonth < freeLimit,
    expiresAt: null,
    enabled,
    adminOverride,
    adminNote,
    storeUrl,
    storePath,
    isUnlimited: false,
  };
}

export async function assertCanGenerate(
  userId: string,
  opts?: { isAdmin?: boolean; req?: NextRequest },
): Promise<SellerMarketingAccess> {
  const access = await getSellerMarketingAccess(userId, opts);
  if (!access.allowed) {
    const err = new Error(access.blockedReason || 'Acceso denegado');
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  if (!access.canGenerate) {
    const err = new Error('Has alcanzado el límite de generaciones este mes. Mejora a Pro para continuar.');
    (err as Error & { status: number; code: string }).status = 402;
    (err as Error & { code: string }).code = 'QUOTA_EXCEEDED';
    throw err;
  }
  return access;
}

export async function recordGeneration(
  userId: string,
  meta?: { gigId?: string; channel?: string },
): Promise<void> {
  try {
    await prisma.sellerMarketingGeneration.create({
      data: {
        userId,
        gigId: meta?.gigId ?? null,
        channel: meta?.channel ?? null,
      },
    });
  } catch {
    // non-fatal if table missing in some envs
  }
}

export async function activateProSubscription(
  userId: string,
  wompiReference: string,
): Promise<void> {
  const now = new Date();
  const existing = await ensureMarketingSubscription(userId);
  const base = existing?.expiresAt && existing.expiresAt > now ? existing.expiresAt : now;
  const expiresAt = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);

  await prisma.sellerMarketingSubscription.upsert({
    where: { userId },
    create: {
      userId,
      tier: 'pro',
      expiresAt,
      wompiReference,
    },
    update: {
      tier: 'pro',
      expiresAt,
      wompiReference,
    },
  });
}