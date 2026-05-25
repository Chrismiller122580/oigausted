import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    await prisma.gig.delete({ where: { id: gigId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin gig delete error:', error);
    return NextResponse.json({ error: 'Error eliminando gig' }, { status: 500 });
  }
}
