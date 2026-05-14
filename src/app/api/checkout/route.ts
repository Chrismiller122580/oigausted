import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { gigId } = await req.json();
    const gig = await prisma.gig.findUnique({ where: { id: gigId } });

    if (!gig) return NextResponse.json({ error: "Gig not found" }, { status: 404 });

    const order = await prisma.order.create({
      data: {
        buyerId: session.user.id,
        sellerId: gig.sellerId,
        gigId: gig.id,
        price: gig.price,
        status: 'Pending',
        reference: `order_${Date.now()}`,
      }
    });

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
