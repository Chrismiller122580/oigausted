import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPanelSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { devLog } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminPanelSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const userId = new URL(req.url).searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    const violations = await prisma.contactViolation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        contextType: true,
        contextId: true,
        violationTypes: true,
        snippet: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ violations });
  } catch (error) {
    devLog('Admin contact violations error:', error);
    return NextResponse.json({ error: 'Error cargando violaciones' }, { status: 500 });
  }
}