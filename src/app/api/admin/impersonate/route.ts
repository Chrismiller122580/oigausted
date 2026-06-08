import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { devLog } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // NOTE: This is "view profile as" only + full audit. 
    // It does NOT perform real session impersonation or elevate privileges.
    // The frontend opens /profile?impersonate=... in a new tab while the admin remains logged in.
    // Log the access for compliance.
    const adminId = (session.user as any).id;
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
    const userAgent = req.headers.get('user-agent') || null;
    await logAuditEvent({
      adminId,
      action: 'USER_IMPERSONATED',
      targetType: 'User',
      targetId: userId,
      details: {
        impersonatedEmail: targetUser.email,
        impersonatedRole: targetUser.role,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ 
      success: true, 
      user: targetUser,
      message: `Impersonación iniciada para ${targetUser.email}`
    });
  } catch (error) {
    devLog('Impersonate error:', error);
    return NextResponse.json({ error: 'Error al impersonar' }, { status: 500 });
  }
}
