import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// @ts-ignore
// @ts-ignore
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { devLog, toPrismaJson } from '@/lib/utils';
import { logAuditEvent } from '@/lib/audit';

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

    // Wrap create + audit in tx for integrity (order + audit atomic)
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          buyerId: userId,
          sellerId: gig.sellerId,
          gigId: gig.id,
          price: gig.price,
          status: 'Pending',
          customFields: null
        }
      });
      await logAuditEvent({
        performedById: userId,
        action: 'ORDER_CREATED',
        targetType: 'Order',
        targetId: created.id,
        details: toPrismaJson({ gigId: gig.id, price: gig.price })
      });
      return created;
    });

    devLog('Order created via checkout:', order.id);

    return NextResponse.json({ 
      success: true, 
      order 
    });

  } catch (error: any) {
    devLog('Checkout error:', error);
    return NextResponse.json({ 
      error: "Failed to create order", 
      details: error.message 
    }, { status: 500 });
  }
}
