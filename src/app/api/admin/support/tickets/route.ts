import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
// @ts-ignore
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifications } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';
import { devLog } from '@/lib/utils';

// GET: List all support tickets (admin only), with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const ticketId = searchParams.get('id') || searchParams.get('ticketId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (ticketId) {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } }
        }
      });
      return NextResponse.json({ ticket });
    }

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    devLog('Admin get support tickets error:', error);
    return NextResponse.json({ error: 'Error cargando tickets de soporte' }, { status: 500 });
  }
}

// PATCH: Update a ticket (status, adminReply, resolve)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const adminId = (session?.user as any)?.id;
    if ((session?.user as any)?.role !== 'admin' || !adminId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { ticketId, status, adminReply, priority } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'ticketId requerido' }, { status: 400 });
    }

    const updateData: any = {};
    if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      updateData.status = status;
      if (status === 'resolved' || status === 'closed') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = adminId;
      }
    }
    if (adminReply !== undefined) updateData.adminReply = adminReply?.trim() || null;
    if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
      updateData.priority = priority;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 });
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    // Notify the user about the update
    try {
      const notifTitle = status === 'resolved' || status === 'closed' 
        ? 'Tu ticket de soporte ha sido resuelto'
        : 'Actualización en tu ticket de soporte';
      const notifMsg = adminReply 
        ? `Respuesta del equipo: ${adminReply.substring(0, 100)}${adminReply.length > 100 ? '...' : ''}`
        : `Estado actualizado a: ${status || updated.status}`;

      await notifications.sendInApp(
        updated.userId,
        'system',
        notifTitle,
        notifMsg,
        '/support',
        { ticketId: updated.id, status: updated.status }
      );

      // When resolving/closing, mark the user's older support-related notifications as read.
      // This stops the bell from continuing to show unread for the original "ticket received" notif(s).
      // The fresh "resuelto" notification above remains the actionable unread item.
      if (status === 'resolved' || status === 'closed') {
        await prisma.notification.updateMany({
          where: {
            userId: updated.userId,
            read: false,
            NOT: {
              OR: [
                { title: { contains: 'resuelto' } },
                { title: { contains: 'resolv' } },
              ],
            },
            OR: [
              { link: { contains: ticketId } },
              { link: { contains: '/support' } },
            ],
          },
          data: {
            read: true,
            readAt: new Date(),
          },
        }).catch(() => {});
      }
    } catch (notifErr) {
      console.error('Failed to notify user of ticket update:', notifErr);
    }

    // Audit the update (via admin UI)
    try {
      await logAuditEvent({
        performedById: adminId,
        action: 'SUPPORT_TICKET_UPDATED',
        targetType: 'SupportTicket',
        targetId: ticketId,
        details: { status, adminReply: adminReply?.substring(0, 100), priority },
      });
    } catch (auditErr) {
      console.error('Audit log failed for ticket update:', auditErr);
    }

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error) {
    devLog('Admin update support ticket error:', error);
    return NextResponse.json({ error: 'Error actualizando ticket' }, { status: 500 });
  }
}
