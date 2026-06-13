import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// @ts-ignore
// @ts-ignore
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { devLog } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gigId } = await req.json();
    const gig = await prisma.gig.findUnique({ 
      where: { id: gigId } 
    });

    if (!gig) {
      return NextResponse.json({ error: "Gig not found" }, { status: 404 });
    }

    // Prevent sellers from purchasing their own gigs (server-side enforcement)
    if (gig.sellerId === userId) {
      return NextResponse.json({ error: "No puedes comprar tu propio servicio" }, { status: 403 });
    }

    if (gig.isActive === false) {
      return NextResponse.json({ error: "Este servicio está pausado y no se puede comprar" }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        buyerId: userId,
        sellerId: gig.sellerId,
        gigId: gig.id,
        price: gig.price,
        status: 'Pending',
        customFields: null
      },
      // Explicit select to avoid columns missing in prod DB (e.g. sellerPayoutAt)
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        gigId: true,
        price: true,
        status: true,
        customFields: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    devLog("✅ Order created:", order.id);

    return NextResponse.json({ 
      success: true, 
      order 
    });

  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ 
      error: "Failed to create order", 
      details: error.message 
    }, { status: 500 });
  }
}
