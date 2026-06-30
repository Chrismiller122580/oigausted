import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPanelSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { getSellerMarketingAccess } from '@/lib/seller-marketing-access';
import { devLog } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const session = await requireAdminPanelSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const userId = new URL(req.url).searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
  }

  try {
    const [access, sub] = await Promise.all([
      getSellerMarketingAccess(userId, { req }),
      prisma.sellerMarketingSubscription.findUnique({ where: { userId } }).catch(() => null),
    ]);

    return NextResponse.json({
      subscription: sub,
      access: {
        usedThisMonth: access.usedThisMonth,
        limit: access.limit,
        effectiveTier: access.effectiveTier,
        canGenerate: access.canGenerate,
        allowed: access.allowed,
        expiresAt: access.expiresAt,
        enabled: access.enabled,
        adminOverride: access.adminOverride,
        adminNote: access.adminNote,
      },
    });
  } catch (error) {
    devLog('Admin seller marketing GET error:', error);
    return NextResponse.json({ error: 'Error cargando suscripción' }, { status: 500 });
  }
}