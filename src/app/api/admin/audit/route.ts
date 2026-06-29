import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPanelSession } from '@/lib/admin-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminPanelSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const action = searchParams.get('action');
    const targetType = searchParams.get('targetType');
    const limit = parseInt(searchParams.get('limit') || '50');

    const performedById = searchParams.get('performedById');
    const actorParam = searchParams.get('actor') || performedById;

    let actorWhere: Prisma.AuditLogWhereInput = {};
    if (actorParam) {
      // Try to resolve email to ID for flexible filtering
      const user = await prisma.user.findUnique({
        where: { email: actorParam.toLowerCase() },
        select: { id: true }
      });
      const idToFilter = user?.id || actorParam;
      actorWhere = {
        OR: [
          { performedById: idToFilter },
          { adminId: idToFilter },
        ]
      };
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        ...(adminId && { adminId }),
        ...actorWhere,
        ...(action && { action: { contains: action } }),
        ...(targetType && { targetType: { contains: targetType } }),
      },
      include: {
        admin: {
          select: { id: true, name: true, email: true },
        },
        performedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Audit log fetch error:', error);
    return NextResponse.json({ error: 'Error cargando registros de auditoría' }, { status: 500 });
  }
}
