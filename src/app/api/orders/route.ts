// src/app/api/orders/route.ts - Fixed with GET + POST
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión para comprar' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { gigId, price } = body;

    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      select: { sellerId: true }
    });

    if (!gig) return NextResponse.json({ error: 'Gig no encontrado' }, { status: 404 });

    if (gig.sellerId === session.user.id) {
      return NextResponse.json({ error: 'No puedes comprar tu propio gig' }, { status: 403 });
    }

    const order = await prisma.order.create({
      data: {
        buyerId: session.user.id,
        sellerId: gig.sellerId,
        gigId,
        price: parseFloat(price),
        status: 'pending',
      },
    });

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Error al crear la orden' }, { status: 500 });
  }
}

// NEW: GET method for fetching orders (buyer or seller)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role'); // 'buyer' or 'seller'

  try {
    let where = {};

    if (role === 'seller') {
      where = { sellerId: session.user.id };
    } else {
      where = { buyerId: session.user.id }; // default to buyer
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        gig: { select: { title: true, price: true } },
        buyer: { select: { name: true } },
        seller: { select: { name: true, businessName: true } }
      }
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Error al obtener órdenes' }, { status: 500 });
  }
}
