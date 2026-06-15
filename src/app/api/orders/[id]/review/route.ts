import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notifications } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const review = await prisma.review.findFirst({
      where: {
        orderId,
        reviewerId: userId
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
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const { rating, comment } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Calificación inválida (1-5)' }, { status: 400 });
    }

    // Verify the order belongs to this buyer and is completed
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { 
        id: true,
        buyerId: true, 
        sellerId: true, 
        status: true,
        gig: { select: { title: true } }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (order.buyerId !== userId) {
      return NextResponse.json({ error: 'Solo el comprador puede dejar reseña' }, { status: 403 });
    }

    if (order.status !== 'Completed') {
      return NextResponse.json({ error: 'Solo puedes reseñar pedidos completados' }, { status: 400 });
    }

    // Check if review already exists
    const existing = await prisma.review.findFirst({
      where: { orderId, reviewerId: userId }
    });

    if (existing) {
      return NextResponse.json({ error: 'Ya dejaste una reseña para este pedido' }, { status: 400 });
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        rating: Number(rating),
        comment: comment?.trim() || null,
        reviewerId: userId,
        sellerId: order.sellerId,
        orderId
      }
    });

    // Audit log for system change (buyer left a review)
    await logAuditEvent({
      performedById: userId,
      action: 'REVIEW_SUBMITTED',
      targetType: 'Review',
      targetId: review.id,
      details: { orderId, sellerId: order.sellerId, rating: Number(rating), hasComment: !!comment },
    });

    // Recalculate seller rating
    const allReviews = await prisma.review.findMany({
      where: { sellerId: order.sellerId },
      select: { rating: true }
    });

    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / allReviews.length
      : 0;

    await prisma.user.update({
      where: { id: order.sellerId },
      data: {
        rating: Math.round(avgRating * 10) / 10, // one decimal
        reviewCount: allReviews.length
      }
    });

    // Notify the seller about the new review (triggers rich email via templates too)
    await notifications.sendInApp(
      order.sellerId,
      'review',
      'Nueva reseña recibida',
      `Has recibido una nueva reseña de ${rating} estrellas de ${session.user.name || 'un cliente'}.`,
      `/seller/earnings`,
      {
        gigTitle: order.gig?.title || 'tu servicio',
        rating,
        reviewerName: session.user.name || 'Un cliente',
        orderId: order.id,
        actions: [
          { label: 'Responder a la reseña', action: 'respond_to_review' },
          { label: 'Ver reseñas', action: 'view' }
        ]
      }
    );

    return NextResponse.json({ success: true, review });
  } catch (error: unknown) {
    console.error('Review creation error:', error);
    return NextResponse.json({ error: 'Error al guardar la reseña' }, { status: 500 });
  }
}
