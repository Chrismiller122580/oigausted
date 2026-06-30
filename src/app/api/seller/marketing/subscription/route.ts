import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { getPlatformConfig } from '@/lib/prisma';
import { getSellerMarketingAccess } from '@/lib/seller-marketing-access';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = session?.user?.id;
  if (!uid) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
  }

  const role = session?.user?.role;
  if (role !== 'seller' && role !== 'admin') {
    return NextResponse.json({ error: 'Solo vendedores pueden acceder' }, { status: 403 });
  }

  const [access, config] = await Promise.all([
    getSellerMarketingAccess(uid, { isAdmin: isAdmin(session), req }),
    getPlatformConfig(),
  ]);

  return NextResponse.json({
    tier: access.effectiveTier,
    paidTier: access.tier,
    usedThisMonth: access.usedThisMonth,
    limit: access.limit,
    canGenerate: access.canGenerate,
    isUnlimited: access.isUnlimited,
    allowed: access.allowed,
    blockedReason: access.blockedReason,
    expiresAt: access.expiresAt,
    storeUrl: access.storeUrl,
    storePath: access.storePath,
    proPriceCOP: config.marketingStudioProPriceCOP ?? 29900,
    adminState: {
      enabled: access.enabled,
      adminOverride: access.adminOverride,
      adminNote: access.adminNote,
    },
  });
}