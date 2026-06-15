import { NextRequest, NextResponse } from 'next/server';
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notifications } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

// Admin-only endpoint to send manual notifications to any user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { userId, title, message, category = 'system', type = 'in_app' } = await req.json();

    if (!userId || !title || !message) {
      return NextResponse.json({ error: 'userId, title and message are required' }, { status: 400 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    let result;
    if (type === 'in_app') {
      result = await notifications.sendInApp(userId, category, title, message);
    } else if (type === 'email') {
      result = await notifications.sendEmail(userId, title, message);
    } else {
      result = await notifications.sendInApp(userId, category, title, message);
    }

    // Audit the manual notification send (important for abuse tracking)
    const adminId = session.user.id;
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
    const userAgent = req.headers.get('user-agent') || null;
    await logAuditEvent({
      adminId,
      action: 'ADMIN_SENT_NOTIFICATION',
      targetType: 'User',
      targetId: userId,
      details: {
        title,
        message: message.substring(0, 100),
        category,
        type,
        recipientEmail: user.email,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ 
      success: true, 
      message: `Notificación enviada a ${user.email}`,
      result 
    });
  } catch (error) {
    console.error('Admin send notification error:', error);
    return NextResponse.json({ error: 'Error enviando notificación' }, { status: 500 });
  }
}
