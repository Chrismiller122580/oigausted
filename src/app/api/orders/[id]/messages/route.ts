import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifications } from '@/lib/notifications';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const messages = await prisma.orderMessage.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' }
    });

    // Consistent shape expected by frontend
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Error cargando mensajes' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';

    let content = '';
    let isFromBuyer = true;

    if (contentType.includes('multipart/form-data')) {
      // File upload path (basic support - files should ideally go to /api/upload + OrderFile)
      // For now we store a placeholder message; real file handling can be improved later
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      content = file ? `📎 Archivo: ${file.name}` : '📎 Archivo adjunto';
    } else {
      // JSON text message
      const body = await request.json().catch(() => ({}));
      content = body.content || body.text || '';
    }

    // Determine direction (best effort using order)
    try {
      const order = await prisma.order.findUnique({ where: { id: orderId }, select: { buyerId: true } });
      if (order) {
        isFromBuyer = session.user.id === order.buyerId;
      }
    } catch {}

    const message = await prisma.orderMessage.create({
      data: {
        orderId,
        content: content || '(sin contenido)',
        isFromBuyer,
      }
    });

    // Notify the other party
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { buyerId: true, sellerId: true, gig: { select: { title: true } } }
      });

      if (order) {
        const recipientId = isFromBuyer ? order.sellerId : order.buyerId;
        const senderRole = isFromBuyer ? 'comprador' : 'vendedor';

        // In-app notification (category 'message' or 'order' — both work)
        await notifications.sendInApp(
          recipientId,
          'order',  // so it respects orderUpdates preference
          `Nuevo mensaje en el pedido`,
          `${senderRole} te ha enviado un mensaje sobre "${order.gig.title}".`,
          `/orders/${orderId}`
        );

        // Email notification (using direct for proper 'order' category)
        await notifications.sendNotification({
          userId: recipientId,
          category: 'order',
          type: 'email',
          title: `Nuevo mensaje sobre "${order.gig.title}"`,
          message: `${senderRole} te ha enviado un mensaje: "${content?.substring(0, 100) || 'Ver mensaje completo'}..."`,
          link: `/orders/${orderId}`,
          data: { orderId, gigTitle: order.gig.title }
        });
      }
    } catch (notifErr) {
      console.error('Failed to send message notification', notifErr);
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json({ error: 'Error enviando mensaje' }, { status: 500 });
  }
}
