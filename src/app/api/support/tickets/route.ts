import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifications } from '@/lib/notifications';
import { notifyAdminsSupportTicket } from '@/lib/admin-notifications';
import { createOpeningMessage, listTicketMessages } from '@/lib/support-tickets';
import { devLog } from '@/lib/utils';
import { logAuditEvent } from '@/lib/audit';

// POST: Submit a new support ticket (any logged-in user)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para enviar un ticket de soporte' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subject, message, category = 'other', priority = 'medium' } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Asunto y mensaje son requeridos' },
        { status: 400 }
      );
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject: subject.trim(),
        message: message.trim(),
        category: category.trim(),
        priority: ['low', 'medium', 'high', 'urgent'].includes(priority)
          ? priority
          : 'medium',
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // Seed thread with the opening user message
    await createOpeningMessage({
      ticketId: ticket.id,
      userId,
      body: message.trim(),
    });

    try {
      await notifications.sendInApp(
        userId,
        'system',
        'Ticket de soporte recibido',
        `Tu ticket "${subject}" ha sido recibido. Te responderemos pronto.`,
        '/support',
        {
          ticketId: ticket.id,
          subject: subject.trim(),
          kind: 'received',
        }
      );

      await notifyAdminsSupportTicket({
        ticketId: ticket.id,
        subject,
        message,
        category,
        priority,
        userName: ticket.user.name,
        userEmail: ticket.user.email,
      });
    } catch (notifErr) {
      devLog('Failed to send support confirmation notif:', notifErr);
    }

    try {
      await logAuditEvent({
        performedById: userId,
        action: 'SUPPORT_TICKET_CREATED',
        targetType: 'SupportTicket',
        targetId: ticket.id,
        details: { subject, category, priority },
      });
    } catch (auditErr) {
      devLog('Audit log failed for ticket creation:', auditErr);
    }

    const messages = await listTicketMessages(ticket.id, { includeInternal: false });

    return NextResponse.json({ success: true, ticket: { ...ticket, messages } });
  } catch (error) {
    devLog('Support ticket submit error:', error);
    return NextResponse.json(
      { error: 'Error al enviar el ticket de soporte' },
      { status: 500 }
    );
  }
}

// GET: List current user's support tickets (public thread messages only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        subject: true,
        message: true,
        category: true,
        priority: true,
        status: true,
        adminReply: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
      },
    });

    const withMessages = await Promise.all(
      tickets.map(async (t: (typeof tickets)[number]) => {
        const messages = await listTicketMessages(t.id, { includeInternal: false });
        return { ...t, messages };
      })
    );

    return NextResponse.json({ tickets: withMessages });
  } catch (error) {
    console.error('Get my tickets error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo tus tickets' },
      { status: 500 }
    );
  }
}
