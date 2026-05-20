import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const review = await prisma.review.findFirst({
      where: {
        orderId,
        reviewerId: session.user.id
      },
      include: {
        reviewer: { select: { name: true } }
      }
    });

    return NextResponse.json({ review });
  } catch (error) {
    return NextResponse.json({ error: 'Error obteniendo reseña' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const { rating, comment } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Calificación inválida (1-5)' }, { status: 400 });
    }

    // Verify the order belongs to this buyer and is completed
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { buyerId: true, sellerId: true, status: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (order.buyerId !== session.user.id) {
      return NextResponse.json({ error: 'Solo el comprador puede dejar reseña' }, { status: 403 });
    }

    if (order.status !== 'Completed') {
      return NextResponse.json({ error: 'Solo puedes reseñar pedidos completados' }, { status: 400 });
    }

    // Check if review already exists
    const existing = await prisma.review.findFirst({
      where: { orderId, reviewerId: session.user.id }
    });

    if (existing) {
      return NextResponse.json({ error: 'Ya dejaste una reseña para este pedido' }, { status: 400 });
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        rating: Number(rating),
        comment: comment?.trim() || null,
        reviewerId: session.user.id,
        sellerId: order.sellerId,
        orderId
      }
    });

    // Recalculate seller rating
    const allReviews = await prisma.review.findMany({
      where: { sellerId: order.sellerId },
      select: { rating: true }
    });

    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

    await prisma.user.update({
      where: { id: order.sellerId },
      data: {
        rating: Math.round(avgRating * 10) / 10, // one decimal
        reviewCount: allReviews.length
      }
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error('Review creation error:', error);
    return NextResponse.json({ error: 'Error al guardar la reseña' }, { status: 500 });
  }
}
