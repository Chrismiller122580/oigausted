import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// @ts-ignore
// @ts-ignore
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { devLog } from '@/lib/utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;   // ← This is the required fix for Next.js 16

    const gig = await prisma.gig.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            businessName: true,
            profilePicture: true,
            rating: true,
            reviewCount: true,
          }
        }
      }
    });

    if (!gig) {
      return NextResponse.json({ error: 'Gig no encontrado' }, { status: 404 });
    }

    return NextResponse.json(gig);
  } catch (error) {
    devLog('Get gig error:', error);
    return NextResponse.json({ error: 'Error al cargar el gig' }, { status: 500 });
  }
}

// PUT - Update gig (only the owner can edit)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isAdmin = (session?.user as any)?.role === 'admin';

    if (!userId) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const existing = await prisma.gig.findUnique({
      where: { id },
      select: { sellerId: true }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Gig no encontrado' }, { status: 404 });
    }

    if (existing.sellerId !== userId && !isAdmin) {
      return NextResponse.json({ error: 'No tienes permiso para editar este gig' }, { status: 403 });
    }

    const body = await req.json();
    const { 
      title, 
      description, 
      price, 
      category, 
      imageUrl, 
      fields, 
      addons, 
      completionTime,
      isActive,
      // Geolocation fields
      city,
      latitude,
      longitude,
      isRemote
    } = body;

    const updated = await prisma.gig.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(category !== undefined && { category }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(fields !== undefined && { fields: fields ? JSON.stringify(fields) : null }),
        ...(addons !== undefined && { addons: addons ? JSON.stringify(addons) : null }),
        ...(completionTime !== undefined && { completionTime }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        // Geolocation (only set if provided)
        ...(city !== undefined && { city: city || null }),
        ...(latitude !== undefined && { latitude: latitude != null ? Number(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude != null ? Number(longitude) : null }),
        ...(isRemote !== undefined && { isRemote: Boolean(isRemote) }),
      },
    });

    devLog("Gig updated:", id);

    return NextResponse.json({ 
      success: true, 
      gigId: updated.id,
      message: "Servicio actualizado correctamente" 
    });

  } catch (error: any) {
    devLog('PUT gig error:', error);
    return NextResponse.json({ error: 'Error al actualizar el gig' }, { status: 500 });
  }
}

// DELETE - Delete a gig (only owner, and preferably no active orders)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isAdmin = (session?.user as any)?.role === 'admin';

    if (!userId) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const existing = await prisma.gig.findUnique({
      where: { id },
      select: { sellerId: true }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Gig no encontrado' }, { status: 404 });
    }

    if (existing.sellerId !== userId && !isAdmin) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar este gig' }, { status: 403 });
    }

    // Optional safety: check for active orders
    const activeOrders = await prisma.order.count({
      where: {
        gigId: id,
        status: { notIn: ['Completed', 'Cancelled'] }
      }
    });

    if (activeOrders > 0) {
      return NextResponse.json({ 
        error: 'No puedes eliminar un servicio que tiene pedidos activos. Cancela o completa los pedidos primero.' 
      }, { status: 400 });
    }

    await prisma.gig.delete({ where: { id } });

    devLog("Gig deleted:", id);

    return NextResponse.json({ 
      success: true, 
      message: "Servicio eliminado correctamente" 
    });

  } catch (error: any) {
    devLog('DELETE gig error:', error);
    return NextResponse.json({ error: 'Error al eliminar el gig' }, { status: 500 });
  }
}
