import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const action = searchParams.get('action');
    const targetType = searchParams.get('targetType');
    const limit = parseInt(searchParams.get('limit') || '50');

    const logs = await prisma.auditLog.findMany({
      where: {
        ...(adminId && { adminId }),
        ...(action && { action }),
        ...(targetType && { targetType }),
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
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
