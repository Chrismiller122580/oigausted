import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPanelFromDb } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { devLog } from '@/lib/utils';
import { createImpersonationToken } from '@/lib/impersonation';

export async function POST(req: NextRequest) {
  try {
    const access = await requireAdminPanelFromDb();
    const session = access?.session;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { userId } = await req.json();

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 });
    }

    const actorId = session.user.id;
    const actorEmail = session.user.email;

    if (userId === actorId) {
      return NextResponse.json({ error: 'No puedes impersonar tu propia cuenta' }, { status: 400 });
    }

    // Load target for audit + validation
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        staffRole: true,
        businessName: true,
        isActive: true,
      }
    });

    if (!target) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (target.isActive === false) {
      return NextResponse.json({ error: 'No se puede impersonar un usuario inactivo' }, { status: 400 });
    }

    // Never let staff become an admin by impersonating one
    if (target.role === 'admin') {
      return NextResponse.json({ error: 'No se puede impersonar una cuenta de administrador' }, { status: 400 });
    }

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
    const userAgent = req.headers.get('user-agent') || null;

    // Record the impersonation start in the immutable audit log
    await logAuditEvent({
      performedById: actorId,
      action: 'USER_IMPERSONATED',
      targetType: 'User',
      targetId: userId,
      details: {
        impersonated: {
          id: target.id,
          email: target.email,
          name: target.name,
          role: target.role,
          staffRole: target.staffRole,
          businessName: target.businessName,
        },
        impersonator: {
          id: actorId,
          email: actorEmail ?? null,
          isFullAdmin: access.isFullAdmin,
        },
      },
      ipAddress,
      userAgent,
    });

    const impersonationToken = createImpersonationToken(actorId, target.id);
    if (!impersonationToken) {
      return NextResponse.json({ error: 'Impersonación no disponible (falta NEXTAUTH_SECRET)' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      impersonationToken,
      target: {
        id: target.id,
        email: target.email,
        name: target.name,
        role: target.role,
      }
    });
  } catch (error) {
    devLog('Admin impersonate error:', error);
    return NextResponse.json({ error: 'Error iniciando impersonación' }, { status: 500 });
  }
}
