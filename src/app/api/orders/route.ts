import { NextResponse } from 'next/server';
// @ts-ignore
// @ts-ignore
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifications } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';
import { devLog } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const role = (session?.user as any)?.role;
    if (role && role !== 'buyer' && role !== 'admin') {
      return NextResponse.json({ error: 'Solo compradores pueden crear pedidos' }, { status: 403 });
    }

    // LEGACY: This creation path is deprecated in favor of /api/checkout (Wompi flow).
    // Kept for backward compat but now has full isActive + role guards.

    const body = await request.json();
    const { gigId, price, customFields = {} } = body;

    // Ensure buyer exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: (session?.user as any)?.name || 'Comprador',
        email: session?.user?.email || '',
        role: 'buyer',
      }
    });

    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      include: { seller: true }
    });

    if (!gig) return NextResponse.json({ error: 'Gig no encontrado' }, { status: 404 });

    // Legacy creation path (main flow uses /api/checkout). Add missing guards for safety.
    if (gig.isActive === false) {
      return NextResponse.json({ error: 'Este servicio está pausado y no se puede comprar' }, { status: 400 });
    }

    // Prevent sellers from purchasing their own gigs (server-side enforcement)
    if (gig.sellerId === userId) {
      return NextResponse.json({ error: 'No puedes comprar tu propio servicio' }, { status: 403 });
    }

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
        buyerId: userId,
        sellerId: gig.sellerId,
        gigId: gig.id,
        price: Number(price),
        customFields: customFields ? JSON.stringify(customFields) : null,
        status: 'Pending',
      },
      // Explicit select to avoid missing columns like sellerPayoutAt
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        gigId: true,
        price: true,
        status: true,
        customFields: true,
        createdAt: true,
        buyer: { select: { name: true } },
      }
    });

    // Note: 'order' here has limited shape due to explicit select (to avoid prod DB column issues).
    // Relations like buyer are included only as needed for notifications.

    // Audit log for system change (buyer action)
    await logAuditEvent({
      performedById: userId,
      action: 'ORDER_CREATED',
      targetType: 'Order',
      targetId: order.id,
      details: {
        gigId: gig.id,
        gigTitle: gig.title,
        price: Number(price),
        sellerId: gig.sellerId,
      },
    });

    // Notify seller about new order (email will be sent automatically by the notification system)
    await notifications.sendInApp(
      gig.sellerId,
      'order',
      'Nuevo pedido recibido',
      `Tienes un nuevo pedido por "${gig.title}" de ${order.buyer?.name || 'un comprador'}.`,
      `/orders/${order.id}`,
      {
        gigTitle: gig.title,
        amount: Number(price),
        buyerName: order.buyer?.name || 'Un comprador',
        orderId: order.id,
        actions: [
          { label: 'Ver Pedido', action: 'view_order' },
          { label: 'Iniciar Pedido', action: 'start_order' },
        ]
      }
    );

    // Also notify the buyer (confirmation) - will trigger email too
    await notifications.sendInApp(
      userId,
      'order',
      'Pedido creado',
      `Tu pedido para "${gig.title}" fue registrado correctamente.`,
      `/orders/${order.id}`,
      {
        gigTitle: gig.title,
        amount: Number(price),
        sellerName: gig.seller?.name || 'Vendedor',
        orderId: order.id,
      }
    );

    return NextResponse.json({ success: true, orderId: order.id, order });
  } catch (error: any) {
    devLog('Order creation error:', error);
    return NextResponse.json({ error: error.message || 'Error al crear la orden' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const role = url.searchParams.get('role') || 'buyer';
    const isAdmin = (session?.user as any)?.role === 'admin';
    const viewAll = url.searchParams.get('view') === 'all' && isAdmin;

    let where: any = {};
    if (viewAll) {
      // Admin can view all orders for payouts/oversight
      where = {};
    } else if (role === 'seller') {
      where = { sellerId: userId };
    } else {
      where = { buyerId: userId };
    }

    let orders;
    try {
      // Try with sellerPayoutAt (for payouts page to filter paid/unpaid reliably)
      orders = await prisma.order.findMany({
        where,
        select: {
          id: true,
          price: true,
          status: true,
          progress: true,
          trackingNumber: true,
          createdAt: true,
          updatedAt: true,
          buyerId: true,
          sellerId: true,
          gigId: true,
          customFields: true,
          sellerPayoutAt: true,
          wompiPayoutRef: true,
          serviceLatitude: true,
          serviceLongitude: true,
          serviceAddress: true,
          gig: { select: { title: true, imageUrl: true } },
          buyer: { select: { id: true, name: true, email: true } },
          seller: { select: { id: true, name: true, businessName: true, referredById: true, payoutBankCode: true, payoutAccountNumber: true, payoutAccountType: true, payoutHolderName: true, payoutDocumentType: true, payoutDocumentNumber: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (e: any) {
      // Fallback if column still missing in this DB (prod drift) - omit it, payouts page will use local persistence
      devLog('orders GET: sellerPayoutAt column missing, falling back (see payouts page localMarked)');
      orders = await prisma.order.findMany({
        where,
        select: {
          id: true,
          price: true,
          status: true,
          progress: true,
          trackingNumber: true,
          createdAt: true,
          updatedAt: true,
          buyerId: true,
          sellerId: true,
          gigId: true,
          customFields: true,
          serviceLatitude: true,
          serviceLongitude: true,
          serviceAddress: true,
          gig: { select: { title: true, imageUrl: true } },
          buyer: { select: { id: true, name: true, email: true } },
          seller: { select: { id: true, name: true, businessName: true, referredById: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      // attach nulls for payout tracking fields (old DB / pre-migration); payouts UI falls back to localStorage for marked state
      orders = orders.map((o: any) => ({
        ...o,
        sellerPayoutAt: null,
        wompiPayoutRef: null,
        // seller payout bank fields absent in this path (UI will treat as "no bank configured")
      }));
    }

    return NextResponse.json(orders);  // sellerPayoutAt included when column present in DB; nulls + client localMarked otherwise (see admin/payouts)
  } catch (error: any) {
    devLog('Orders fetch error:', error);
    // Include more detail in dev, generic in prod response
    return NextResponse.json({ 
      error: 'Error cargando órdenes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  }
}
