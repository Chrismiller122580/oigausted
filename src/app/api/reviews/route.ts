import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get('sellerId');
    const reviewerId = searchParams.get('reviewerId');
    const gigId = searchParams.get('gigId');
    const limit = parseInt(searchParams.get('limit') || '6');

    if (!sellerId && !reviewerId && !gigId) {
      return NextResponse.json({ error: 'sellerId, reviewerId, or gigId is required' }, { status: 400 });
    }

    const where: import('@prisma/client').Prisma.ReviewWhereInput = {};
    if (sellerId) where.sellerId = sellerId;
    if (reviewerId) where.reviewerId = reviewerId;

    // If gigId is provided, we filter reviews for orders of that specific gig
    if (gigId) {
      where.order = { gigId };
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: {
          select: { id: true, name: true, profilePicture: true }
        },
        order: {
          select: {
            gig: { select: { id: true, title: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 20)
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    // Return empty list on error (e.g. schema drift, bad relations after rollback) to avoid breaking UIs that call this
    return NextResponse.json({ reviews: [] });
  }
}
