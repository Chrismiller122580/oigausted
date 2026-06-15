import { NextResponse } from 'next/server';
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifications } from '@/lib/notifications';
import { put } from '@vercel/blob';
import { validateUploadFile } from '@/lib/upload-validation';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verify caller is part of the order
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { buyerId: true, sellerId: true } });
    if (!order || (order.buyerId !== userId && order.sellerId !== userId)) {
      return NextResponse.json({ error: 'No autorizado para este pedido' }, { status: 403 });
    }

    const messages = await prisma.orderMessage.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
      // Include file attachment fields (requires the migration to have been run)
      select: {
        id: true,
        content: true,
        isFromBuyer: true,
        createdAt: true,
        orderId: true,
        fileUrl: true,
        fileName: true,
      }
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
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verify caller is part of the order
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { buyerId: true, sellerId: true } });
    if (!order || (order.buyerId !== userId && order.sellerId !== userId)) {
      return NextResponse.json({ error: 'No autorizado para este pedido' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') || '';

    let content = '';
    let isFromBuyer = true;

    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (file) {
        const validation = await validateUploadFile(file)
        if (!validation.ok) {
          return NextResponse.json({ error: validation.error }, { status: validation.status })
        }

        const token = process.env.BLOB_READ_WRITE_TOKEN
        if (!token) {
          return NextResponse.json({
            error: 'File upload not available in this environment',
            uploadDisabled: true,
          }, { status: 400 })
        }

        fileName = file.name;

        const blob = await put(file.name, file, {
          token,
          access: 'public',
          addRandomSuffix: true,
        });

        fileUrl = blob.url;
        content = `📎 ${file.name}`;
      } else {
        content = '📎 Archivo adjunto';
      }
    } else {
      // JSON text message
      const body = await request.json().catch(() => ({}));
      content = body.content || body.text || '';
    }

    // Determine direction (best effort using order)
    try {
      const order = await prisma.order.findUnique({ where: { id: orderId }, select: { buyerId: true } });
      if (order) {
        isFromBuyer = userId === order.buyerId;
      }
    } catch {}

    const message = await prisma.orderMessage.create({
      data: {
        orderId,
        content: content || '(sin contenido)',
        isFromBuyer,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
      },
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
