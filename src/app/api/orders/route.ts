import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const body = await request.json();
    const { gigId, price, customFields = {} } = body;

    // Ensure buyer exists
    await prisma.user.upsert({
      where: { id: session.user.id },
      update: {},
      create: {
        id: session.user.id,
        name: session.user.name || 'Comprador',
        email: session.user.email || '',
        role: 'buyer',
      }
    });

    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      include: { seller: true }
    });

    if (!gig) return NextResponse.json({ error: 'Gig no encontrado' }, { status: 404 });

    // Ensure seller exists
    await prisma.user.upsert({
      where: { id: gig.sellerId },
      update: {},
      create: {
        id: gig.sellerId,
        name: gig.seller.name || 'Vendedor',
        role: 'seller',
      }
    });

    const order = await prisma.order.create({
      data: {
        buyerId: session.user.id,
        sellerId: gig.sellerId,
        gigId: gig.id,
        price: Number(price),
        customFields,
        status: 'Pending',
      },
      include: {
        gig: true,
        buyer: true,
        seller: true
      }
    });

    return NextResponse.json({ success: true, orderId: order.id, order });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: error.message || 'Error al crear la orden' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const role = url.searchParams.get('role') || 'buyer';

    const orders = await prisma.order.findMany({
      where: role === 'seller' 
        ? { sellerId: session.user.id } 
        : { buyerId: session.user.id },
      include: {
        gig: { select: { title: true, imageUrl: true } },
        buyer: { select: { name: true } },
        seller: { select: { name: true, businessName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Orders fetch error:', error);
    return NextResponse.json({ error: 'Error cargando órdenes' }, { status: 500 });
  }
}
