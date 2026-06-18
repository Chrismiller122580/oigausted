import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { devLog } from '@/lib/utils';
import { notifyAdminsNewOrder } from '@/lib/admin-notifications';
import { createPendingOrder, ensureBuyerForOrder } from '@/lib/order-queries';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gigId } = await req.json();
    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      select: {
        id: true,
        title: true,
        price: true,
        sellerId: true,
        isActive: true,
        seller: { select: { name: true, businessName: true } },
      },
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

    await ensureBuyerForOrder(session?.user)

    const order = await createPendingOrder({
      buyerId: userId,
      sellerId: gig.sellerId,
      gigId: gig.id,
      price: gig.price,
    });

    devLog("✅ Order created:", order.id);

    const buyer = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    })

    notifyAdminsNewOrder({
      orderId: order.id,
      gigTitle: gig.title,
      amount: gig.price,
      buyerName: buyer?.name || session?.user?.name,
      sellerName: gig.seller?.businessName || gig.seller?.name,
    }).catch(() => {})

    return NextResponse.json({ 
      success: true, 
      order 
    });

  } catch (error: unknown) {
    console.error("Checkout error:", error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      error: "Failed to create order", 
      details
    }, { status: 500 });
  }
}
