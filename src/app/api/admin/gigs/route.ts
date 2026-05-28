import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { notifications } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const gigs = await prisma.gig.findMany({
      where: search
        ? {
            OR: [
              { title: { contains: search } },
              { seller: { name: { contains: search } } },
              { seller: { email: { contains: search } } }
            ]
          }
        : {},
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            businessName: true
          }
        },
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const gigsWithStats = gigs.map(g => ({
      ...g,
      orderCount: g._count.orders
    }));

    return NextResponse.json({ gigs: gigsWithStats });
  } catch (error) {
    console.error('Admin gigs error:', error);
    return NextResponse.json({ error: 'Error cargando gigs' }, { status: 500 });
  }
}

// PATCH for moderation actions (isActive toggle, etc.)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { gigId, isActive } = await req.json();

    if (!gigId) {
      return NextResponse.json({ error: 'gigId requerido' }, { status: 400 });
    }

    const updated = await prisma.gig.update({
      where: { id: gigId },
      data: {
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      }
    });

    // Log moderation action
    const adminId = (session.user as any).id;
    await logAuditEvent({
      adminId,
      action: isActive ? 'GIG_ACTIVATED' : 'GIG_DEACTIVATED',
      targetType: 'Gig',
      targetId: gigId,
      details: { isActive: Boolean(isActive) },
    });

    // Notify seller about gig moderation
    await logAuditEvent({
      adminId,
      action: isActive ? 'GIG_ACTIVATED' : 'GIG_DEACTIVATED',
      targetType: 'Gig',
      targetId: gigId,
      details: { isActive: Boolean(isActive) },
    });

    // Send in-app notification to seller
    await notifications.sendInApp(
      updated.sellerId,
      'gig',
      isActive ? 'Tu gig ha sido activado' : 'Tu gig ha sido pausado',
      `El servicio "${updated.title}" ha cambiado de estado.`,
      `/seller/gigs`
    );

    return NextResponse.json({ success: true, gig: updated });
  } catch (error) {
    console.error('Admin gig update error:', error);
    return NextResponse.json({ error: 'Error actualizando gig' }, { status: 500 });
  }
}

// DELETE gig (admin moderation)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { gigId } = await req.json();

    if (!gigId) {
      return NextResponse.json({ error: 'gigId requerido' }, { status: 400 });
    }

    // Fetch gig before deleting for notification
    const gigToDelete = await prisma.gig.findUnique({
      where: { id: gigId },
      select: { sellerId: true, title: true }
    });

    await prisma.gig.delete({ where: { id: gigId } });

    const adminId = (session.user as any).id;
    await logAuditEvent({
      adminId,
      action: 'GIG_DELETED',
      targetType: 'Gig',
      targetId: gigId,
    });

    if (gigToDelete?.sellerId) {
      await notifications.sendInApp(
        gigToDelete.sellerId,
        'gig',
        'Tu gig ha sido eliminado',
        `El servicio "${gigToDelete.title}" ha sido eliminado por un administrador.`,
        `/seller/gigs`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin gig delete error:', error);
    return NextResponse.json({ error: 'Error eliminando gig' }, { status: 500 });
  }
}
