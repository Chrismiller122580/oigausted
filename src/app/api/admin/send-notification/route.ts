import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPanelSession } from '@/lib/admin-auth';
import { notifications, type NotificationChannels } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

const VALID_CHANNELS = new Set<NotificationChannels>(['in_app', 'email', 'both']);

// Admin / CS endpoint to send manual notifications to any user
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminPanelSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const {
      userId,
      title,
      message,
      category = 'system',
      channels: channelsRaw,
      type, // legacy: 'in_app' | 'email'
      link,
    } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ error: 'userId, title and message are required' }, { status: 400 });
    }

    // Prefer explicit channels; map legacy type when channels omitted
    let channels: NotificationChannels = 'both';
    if (channelsRaw && VALID_CHANNELS.has(channelsRaw)) {
      channels = channelsRaw;
    } else if (type === 'email') {
      channels = 'email';
    } else if (type === 'in_app') {
      channels = 'both'; // historical UI default: in-app + auto email
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // High priority so CS/admin outreach is not dropped by quiet hours
    const result = await notifications.sendNotification({
      userId,
      category: typeof category === 'string' && category.trim() ? category.trim() : 'system',
      type: channels === 'email' ? 'email' : 'in_app',
      title: String(title).trim(),
      message: String(message).trim(),
      link: typeof link === 'string' && link.trim() ? link.trim() : undefined,
      channels,
      priority: 'high',
    });

    const adminId = session.user.id;
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      null;
    const userAgent = req.headers.get('user-agent') || null;
    await logAuditEvent({
      adminId,
      action: 'ADMIN_SENT_NOTIFICATION',
      targetType: 'User',
      targetId: userId,
      details: {
        title: String(title).substring(0, 100),
        message: String(message).substring(0, 100),
        category,
        channels,
        type: channels === 'email' ? 'email' : 'in_app',
        recipientEmail: user.email,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Notificación enviada a ${user.email}`,
      channels,
      result,
    });
  } catch (error) {
    console.error('Admin send notification error:', error);
    return NextResponse.json({ error: 'Error enviando notificación' }, { status: 500 });
  }
}
