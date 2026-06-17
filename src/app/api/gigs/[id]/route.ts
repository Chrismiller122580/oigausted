import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { devLog, parseJsonArrayField } from '@/lib/utils';
import { getGigImages, normalizeGigImagePayload, parseGigImagesField } from '@/lib/gig-images';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;   // ← This is the required fix for Next.js 16

    const gigSelect = {
      id: true,
      title: true,
      description: true,
      price: true,
      category: true,
      completionTime: true,
      imageUrl: true,
      images: true,
      fields: true,
      addons: true,
      isActive: true,
      createdAt: true,
      sellerId: true,
      city: true,
      latitude: true,
      longitude: true,
      isRemote: true,
      seller: {
        select: {
          id: true,
          name: true,
          businessName: true,
          profilePicture: true,
          rating: true,
          reviewCount: true,
        }
      }
    } as const

    let gig: Awaited<ReturnType<typeof prisma.gig.findUnique>> & {
      images?: string | null
    } | null = null

    try {
      gig = await prisma.gig.findUnique({ where: { id }, select: gigSelect })
    } catch (dbErr: unknown) {
      const errMsg = dbErr instanceof Error ? dbErr.message : String(dbErr)
      if (errMsg.includes('images') && errMsg.includes('does not exist')) {
        const { images: _omit, ...selectWithoutImages } = gigSelect
        gig = await prisma.gig.findUnique({ where: { id }, select: selectWithoutImages })
      } else {
        throw dbErr
      }
    }

    if (!gig) {
      return NextResponse.json({ error: 'Gig no encontrado' }, { status: 404 });
    }

    const imageList = getGigImages(gig)

    return NextResponse.json({
      ...gig,
      images: imageList,
      imageUrl: imageList[0] ?? gig.imageUrl ?? null,
      fields: parseJsonArrayField(gig.fields),
      addons: parseJsonArrayField(gig.addons),
    });
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
    const userId = session?.user?.id;
    const isAdmin = session?.user?.role === 'admin';

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
      images,
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

    const imagePayload =
      images !== undefined || imageUrl !== undefined
        ? normalizeGigImagePayload(
            images !== undefined ? parseGigImagesField(images) : undefined,
            imageUrl
          )
        : null

    const updateData = {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(category !== undefined && { category }),
        ...(imagePayload && {
          imageUrl: imagePayload.imageUrl,
          images: imagePayload.images,
        }),
        ...(fields !== undefined && { fields: fields ? JSON.stringify(fields) : null }),
        ...(addons !== undefined && { addons: addons ? JSON.stringify(addons) : null }),
        ...(completionTime !== undefined && { completionTime }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        // Geolocation (only set if provided)
        ...(city !== undefined && { city: city || null }),
        ...(latitude !== undefined && { latitude: latitude != null ? Number(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude != null ? Number(longitude) : null }),
        ...(isRemote !== undefined && { isRemote: Boolean(isRemote) }),
    }

    let updated
    try {
      updated = await prisma.gig.update({ where: { id }, data: updateData })
    } catch (dbErr: unknown) {
      const errMsg = dbErr instanceof Error ? dbErr.message : String(dbErr)
      if (imagePayload && errMsg.includes('images') && errMsg.includes('does not exist')) {
        const { images: _omit, ...dataWithoutImages } = updateData
        updated = await prisma.gig.update({ where: { id }, data: dataWithoutImages })
      } else {
        throw dbErr
      }
    }

    devLog("Gig updated:", id);

    return NextResponse.json({ 
      success: true, 
      gigId: updated.id,
      message: "Servicio actualizado correctamente" 
    });

  } catch (error: unknown) {
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
    const userId = session?.user?.id;
    const isAdmin = session?.user?.role === 'admin';

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

  } catch (error: unknown) {
    devLog('DELETE gig error:', error);
    return NextResponse.json({ error: 'Error al eliminar el gig' }, { status: 500 });
  }
}
