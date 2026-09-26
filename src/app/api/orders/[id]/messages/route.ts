import { NextResponse } from 'next/server';
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifications } from '@/lib/notifications';
import { put } from '@vercel/blob';
import { validateUploadFile } from '@/lib/upload-validation';
import {
  CONTACT_BLOCKED_MESSAGE,
  detectContactInfo,
} from '@/lib/contact-moderation';
import { recordContactViolation } from '@/lib/contact-violation';

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

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { buyerId: true, sellerId: true },
    });
    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const isParticipant = order.buyerId === userId || order.sellerId === userId;
    let isStaff = false;
    if (!isParticipant) {
      const { requireAdminPanelSession } = await import('@/lib/admin-auth');
      const staffSession = await requireAdminPanelSession();
      isStaff = Boolean(staffSession?.user?.id);
    }
    if (!isParticipant && !isStaff) {
      return NextResponse.json({ error: 'No autorizado para este pedido' }, { status: 403 });
    }

    const messages = await prisma.orderMessage.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
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

    return NextResponse.json({ messages, staffView: isStaff });
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

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { buyerId: true, sellerId: true, status: true },
    });
    if (!order || (order.buyerId !== userId && order.sellerId !== userId)) {
      return NextResponse.json({ error: 'No autorizado para este pedido' }, { status: 403 });
    }

    const purchased = /^(Paid|In_Progress|Completed)$/i.test(String(order.status));
    const contentType = request.headers.get('content-type') || '';

    let content = '';
    let isFromBuyer = true;
    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      if (!purchased) {
        return NextResponse.json(
          { error: 'Los archivos se habilitan después de pagar el pedido' },
          { status: 403 }
        );
      }

      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const text = String(formData.get('content') || '').trim();

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
      }

      content = text || (fileName ? `📎 ${fileName}` : '');
    } else {
      const body = await request.json().catch(() => ({}));
      content = body.content || body.text || '';
    }

    if (!content.trim() && !fileUrl) {
      return NextResponse.json({ error: 'Escribe un mensaje o adjunta un archivo' }, { status: 400 });
    }

    if (content.trim()) {
      const detection = detectContactInfo(content);
      if (detection.blocked) {
        await recordContactViolation(userId, 'order', orderId, detection.types, content);
        return NextResponse.json(
          { error: CONTACT_BLOCKED_MESSAGE, blocked: true, types: detection.types },
          { status: 422 }
        );
      }
    }

    isFromBuyer = userId === order.buyerId;

    const message = await prisma.orderMessage.create({
      data: {
        orderId,
        content: content || '(sin contenido)',
        isFromBuyer,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
      },
    });

    try {
      const fullOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { buyerId: true, sellerId: true, gig: { select: { title: true } } }
      });

      if (fullOrder) {
        const recipientId = isFromBuyer ? fullOrder.sellerId : fullOrder.buyerId;
        const senderRole = isFromBuyer ? 'comprador' : 'vendedor';
        const preview = fileName ? `Archivo: ${fileName}` : content.substring(0, 100);

        await notifications.sendInApp(
          recipientId,
          'message',
          `Nuevo mensaje en el pedido`,
          `${senderRole} te ha enviado un mensaje sobre "${fullOrder.gig.title}".`,
          `/orders/${orderId}`,
          { orderId, gigTitle: fullOrder.gig.title }
        );

        await notifications.sendNotification({
          userId: recipientId,
          category: 'message',
          type: 'email',
          title: `Nuevo mensaje sobre "${fullOrder.gig.title}"`,
          message: `${senderRole} te ha enviado un mensaje: "${preview}..."`,
          link: `/orders/${orderId}`,
          data: { orderId, gigTitle: fullOrder.gig.title }
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
