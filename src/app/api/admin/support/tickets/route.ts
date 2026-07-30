import { NextRequest, NextResponse } from 'next/server';
import {
  requireAdminPanelSession,
  requireFinancePanelSession,
  verifyAccountantFromDb,
} from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { notifications } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';
import { appendTicketMessage, listTicketMessages } from '@/lib/support-tickets';
import { devLog } from '@/lib/utils';
import type { Prisma } from '@prisma/client';

// GET: List support tickets (admin panel or accountant payment disputes)
export async function GET(request: NextRequest) {
  try {
    const session =
      (await requireAdminPanelSession()) ?? (await requireFinancePanelSession());
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const isAccountantOnly =
      session.user.staffRole === 'accountant' &&
      (await verifyAccountantFromDb(session.user.id));

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
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      });
      if (isAccountantOnly && ticket?.category !== 'payment') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
      if (!ticket) {
        return NextResponse.json({ ticket: null });
      }
      const messages = await listTicketMessages(ticket.id, { includeInternal: true });
      return NextResponse.json({ ticket: { ...ticket, messages } });
    }

    const where: Prisma.SupportTicketWhereInput = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (isAccountantOnly) where.category = 'payment';

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });

    // Lightweight list: no full threads (loaded on open)
    return NextResponse.json({ tickets });
  } catch (error) {
    devLog('Admin get support tickets error:', error);
    return NextResponse.json(
      { error: 'Error cargando tickets de soporte' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Update ticket status/priority and/or append a staff message.
 *
 * body:
 *  - ticketId (required)
 *  - status?, priority?
 *  - body?: string — new thread message
 *  - isInternal?: boolean — staff-only note (no user notification)
 *  - adminReply?: string — legacy alias for public body
 */
export async function PATCH(request: NextRequest) {
  try {
    const session =
      (await requireAdminPanelSession()) ?? (await requireFinancePanelSession());
    const adminId = session?.user?.id;
    if (!adminId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const {
      ticketId,
      status,
      priority,
      isInternal = false,
    } = body as {
      ticketId?: string;
      status?: string;
      priority?: string;
      body?: string;
      isInternal?: boolean;
      adminReply?: string | null;
    };

    // Prefer `body` for new messages; accept legacy adminReply as public reply text
    const messageBody =
      typeof body.body === 'string'
        ? body.body.trim()
        : typeof body.adminReply === 'string'
          ? body.adminReply.trim()
          : '';

    if (!ticketId) {
      return NextResponse.json({ error: 'ticketId requerido' }, { status: 400 });
    }

    const isAccountantOnly =
      session.user?.staffRole === 'accountant' &&
      (await verifyAccountantFromDb(adminId));

    if (isAccountantOnly) {
      const existing = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        select: { category: true },
      });
      if (existing?.category !== 'payment') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
    }

    const updateData: Prisma.SupportTicketUpdateInput = {};
    if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      updateData.status = status;
      if (status === 'resolved' || status === 'closed') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = adminId;
      }
      if (status === 'open' || status === 'in_progress') {
        updateData.resolvedAt = null;
        updateData.resolvedBy = null;
      }
    }
    if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
      updateData.priority = priority;
    }

    const internal = Boolean(isInternal);
    let createdMessage = null as Awaited<ReturnType<typeof appendTicketMessage>>;

    if (messageBody) {
      createdMessage = await appendTicketMessage({
        ticketId,
        authorId: adminId,
        body: messageBody,
        isStaff: true,
        isInternal: internal,
      });

      // Denormalize last public staff reply for legacy fields / emails
      if (!internal) {
        updateData.adminReply = messageBody;
      }
    }

    if (Object.keys(updateData).length === 0 && !messageBody) {
      return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 });
    }

    // Ensure updatedAt bumps even if only a message was added without other fields
    if (Object.keys(updateData).length === 0 && messageBody) {
      updateData.updatedAt = new Date();
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify user for public replies or any status change (never for internal-only notes)
    const shouldNotifyUser = !internal && (Boolean(messageBody) || Boolean(status));

    if (shouldNotifyUser) {
      try {
        const effectiveStatus = status || updated.status;
        const isResolved = effectiveStatus === 'resolved' || effectiveStatus === 'closed';
        const kind = isResolved ? 'resolved' : 'update';
        const notifTitle = isResolved
          ? 'Tu ticket de soporte ha sido resuelto'
          : messageBody
            ? 'Nueva respuesta de soporte'
            : 'Actualización en tu ticket de soporte';
        const replyText = !internal && messageBody ? messageBody : updated.adminReply?.trim() || '';
        const notifMsg = replyText
          ? `Respuesta del equipo: ${replyText.substring(0, 160)}${replyText.length > 160 ? '...' : ''}`
          : `Estado actualizado a: ${effectiveStatus}`;

        await notifications.sendInApp(
          updated.userId,
          'system',
          notifTitle,
          notifMsg,
          '/support',
          {
            ticketId: updated.id,
            status: effectiveStatus,
            subject: updated.subject,
            adminReply: replyText || null,
            kind,
            supportUpdate: true,
          }
        );

        if (status === 'resolved' || status === 'closed') {
          await prisma.notification
            .updateMany({
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
            })
            .catch(() => {});
        }
      } catch (notifErr) {
        console.error('Failed to notify user of ticket update:', notifErr);
      }
    }

    try {
      await logAuditEvent({
        performedById: adminId,
        action: internal ? 'SUPPORT_INTERNAL_NOTE' : 'SUPPORT_TICKET_UPDATED',
        targetType: 'SupportTicket',
        targetId: ticketId,
        details: {
          ...(status ? { status } : {}),
          ...(priority ? { priority } : {}),
          isInternal: internal,
          hasMessage: Boolean(messageBody),
          ...(messageBody ? { preview: messageBody.substring(0, 100) } : {}),
        },
      });
    } catch (auditErr) {
      console.error('Audit log failed for ticket update:', auditErr);
    }

    const messages = await listTicketMessages(ticketId, { includeInternal: true });

    return NextResponse.json({
      success: true,
      ticket: { ...updated, messages },
      message: createdMessage,
    });
  } catch (error) {
    devLog('Admin update support ticket error:', error);
    return NextResponse.json(
      { error: 'Error actualizando ticket' },
      { status: 500 }
    );
  }
}
