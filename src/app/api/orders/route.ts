import { NextResponse } from 'next/server';
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyAdminPanelAccess, verifyFinancePanelAccess } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { notifications } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';
import { devLog } from '@/lib/utils';
import { computeOrderPrice } from '@/lib/order-price';
import { notifyAdminsNewOrder } from '@/lib/admin-notifications';
import { fetchOrdersList, orderCreateSelect } from '@/lib/order-queries';
import { OrderStatusLabel, labelToPrismaStatus } from '@/lib/order-status';
import type { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const role = session?.user?.role;
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
        name: session?.user?.name || 'Comprador',
        email: session?.user?.email || '',
        role: 'buyer',
      }
    });

    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      select: {
        id: true,
        title: true,
        price: true,
        fields: true,
        isActive: true,
        sellerId: true,
        seller: { select: { name: true } },
      },
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

    const selections =
      customFields && typeof customFields === 'object' && !Array.isArray(customFields)
        ? customFields
        : {}
    const computedPrice = computeOrderPrice(gig.price, gig.fields, selections)

    const order = await prisma.order.create({
      data: {
        buyerId: userId,
        sellerId: gig.sellerId,
        gigId: gig.id,
        price: computedPrice,
        customFields: customFields ? JSON.stringify(customFields) : null,
        status: labelToPrismaStatus(OrderStatusLabel.Pending),
      },
      select: {
        ...orderCreateSelect,
        buyer: { select: { name: true } },
      },
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
        price: computedPrice,
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
        amount: computedPrice,
        buyerName: order.buyer?.name || 'Un comprador',
        orderId: order.id,
        actions: [{ label: 'Ver Pedido', action: 'view_order' }]
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
        amount: computedPrice,
        sellerName: gig.seller?.name || 'Vendedor',
        orderId: order.id,
      }
    );

    notifyAdminsNewOrder({
      orderId: order.id,
      gigTitle: gig.title,
      amount: computedPrice,
      buyerName: order.buyer?.name || session?.user?.name,
      sellerName: gig.seller?.name,
    }).catch(() => {})

    return NextResponse.json({ success: true, orderId: order.id, order });
  } catch (error: unknown) {
    devLog('Order creation error:', error);
    const errMsg = error instanceof Error ? error.message : 'Error al crear la orden';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const role = url.searchParams.get('role') || 'buyer';
    const panelAccess = session?.user?.id
      ? await verifyAdminPanelAccess(session.user.id, session)
      : false;
    const financeAccess = session?.user?.id
      ? await verifyFinancePanelAccess(session.user.id, session)
      : false;
    const viewAll = url.searchParams.get('view') === 'all' && (panelAccess || financeAccess);

    let where: Prisma.OrderWhereInput = {};
    if (viewAll) {
      // Admin can view all orders for payouts/oversight
      where = {};
    } else if (role === 'seller') {
      where = { sellerId: userId };
    } else {
      where = { buyerId: userId };
    }

    const orders = await fetchOrdersList(where);

    return NextResponse.json(orders);
  } catch (error: unknown) {
    devLog('Orders fetch error:', error);
    const errMsg = error instanceof Error ? error.message : undefined;
    return NextResponse.json({ 
      error: 'Error cargando órdenes',
      details: process.env.NODE_ENV === 'development' ? errMsg : undefined 
    }, { status: 500 });
  }
}
