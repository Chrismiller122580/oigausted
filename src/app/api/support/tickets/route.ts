import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifications } from '@/lib/notifications';
import { devLog } from '@/lib/utils';

// POST: Submit a new support ticket (any logged-in user)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Debes iniciar sesión para enviar un ticket de soporte' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, message, category = 'other', priority = 'medium' } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: 'Asunto y mensaje son requeridos' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject: subject.trim(),
        message: message.trim(),
        category: category.trim(),
        priority: ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium',
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    // Notify admins (in-app to all admins? or via email to supportEmail)
    // For simplicity, send in-app to a system or find admins. Since no easy "all admins", we'll log and perhaps email support.
    try {
      // Send to the ticket submitter confirmation
      await notifications.sendInApp(
        userId,
        'system',
        'Ticket de soporte recibido',
        `Tu ticket "${subject}" ha sido recibido. Te responderemos pronto.`,
        '/support',
        { ticketId: ticket.id }
      );

      // TODO: In real, notify admins via a dedicated admin notification or email to supportEmail
      devLog(`[Support] New ticket from ${ticket.user.email}: ${subject}`);
    } catch (notifErr) {
      console.error('Failed to send support confirmation notif:', notifErr);
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error('Support ticket submit error:', error);
    return NextResponse.json({ error: 'Error al enviar el ticket de soporte' }, { status: 500 });
  }
}

// GET: List current user's support tickets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
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
      }
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Get my tickets error:', error);
    return NextResponse.json({ error: 'Error obteniendo tus tickets' }, { status: 500 });
  }
}
