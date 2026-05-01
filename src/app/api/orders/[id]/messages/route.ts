import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    const messages = await prisma.message.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { name: true, businessName: true } }
      }
    });

    return NextResponse.json(messages);
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

    const { text, fileUrl } = await request.json();

    const message = await prisma.message.create({
      data: {
        orderId,
        senderId: session.user.id,
        text: text || '',
        fileUrl: fileUrl || null,
      },
      include: {
        sender: { select: { name: true, businessName: true } }
      }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json({ error: 'Error enviando mensaje' }, { status: 500 });
  }
}
