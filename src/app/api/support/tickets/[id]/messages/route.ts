import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { appendTicketMessage, listTicketMessages } from '@/lib/support-tickets';
import { notifyAdminsSupportTicket } from '@/lib/admin-notifications';
import { notifications } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';
import { devLog } from '@/lib/utils';

type RouteContext = { params: Promise<{ id: string }> };

/** GET public thread for the ticket owner */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: ticketId } = await context.params;
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, userId: true, status: true },
    });
    if (!ticket || ticket.userId !== userId) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    const messages = await listTicketMessages(ticketId, { includeInternal: false });
    return NextResponse.json({ messages, status: ticket.status });
  } catch (error) {
    devLog('Get ticket messages error:', error);
    return NextResponse.json({ error: 'Error cargando mensajes' }, { status: 500 });
  }
}

/** POST a public follow-up from the ticket owner */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: ticketId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const text = typeof body.body === 'string' ? body.body.trim() : '';
    if (!text) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    if (!ticket || ticket.userId !== userId) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }
    if (ticket.status === 'closed') {
      return NextResponse.json(
        { error: 'Este ticket está cerrado. Abre uno nuevo si necesitas ayuda.' },
        { status: 400 }
      );
    }

    const message = await appendTicketMessage({
      ticketId,
      authorId: userId,
      body: text,
      isStaff: false,
      isInternal: false,
    });

    // Re-open if it was resolved
    if (ticket.status === 'resolved') {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'open', resolvedAt: null, resolvedBy: null },
      });
    } else {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() },
      });
    }

    try {
      await notifyAdminsSupportTicket({
        ticketId,
        subject: `Re: ${ticket.subject}`,
        message: text,
        category: ticket.category || 'other',
        priority: ticket.priority,
        userName: ticket.user.name,
        userEmail: ticket.user.email,
      });

      // Light in-app for admins is covered by notifyAdmins; also confirm to user
      await notifications.sendInApp(
        userId,
        'system',
        'Mensaje enviado al soporte',
        `Tu respuesta en "${ticket.subject}" fue enviada.`,
        '/support',
        { ticketId, subject: ticket.subject, kind: 'update' }
      );
    } catch (e) {
      devLog('Failed to notify on user support reply:', e);
    }

    try {
      await logAuditEvent({
        performedById: userId,
        action: 'SUPPORT_TICKET_USER_REPLY',
        targetType: 'SupportTicket',
        targetId: ticketId,
        details: { preview: text.substring(0, 100) },
      });
    } catch {
      // non-fatal
    }

    const messages = await listTicketMessages(ticketId, { includeInternal: false });
    return NextResponse.json({ success: true, message, messages });
  } catch (error) {
    devLog('User support reply error:', error);
    return NextResponse.json({ error: 'Error enviando mensaje' }, { status: 500 });
  }
}
