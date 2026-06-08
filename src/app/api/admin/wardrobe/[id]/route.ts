import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.wardrobeItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    await prisma.wardrobeItem.delete({ where: { id } });

    const adminId = (session.user as any).id;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;

    await logAuditEvent({
      adminId,
      action: 'WARDROBE_ITEM_DELETED',
      targetType: 'WardrobeItem',
      targetId: id,
      details: { title: existing.title },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Wardrobe DELETE error:', error);
    return NextResponse.json({ error: 'Error al eliminar el item' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.wardrobeItem.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description ?? undefined,
        price: body.price !== undefined ? (body.price ? parseFloat(body.price) : null) : undefined,
        category: body.category ?? undefined,
        imageUrl: body.imageUrl ?? undefined,
        shopifyId: body.shopifyId ?? undefined,
        brand: body.brand ?? undefined,
        color: body.color ?? undefined,
        size: body.size ?? undefined,
        tags: body.tags ?? undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
      },
    });

    const adminId = (session.user as any).id;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;

    await logAuditEvent({
      adminId,
      action: 'WARDROBE_ITEM_UPDATED',
      targetType: 'WardrobeItem',
      targetId: id,
      details: { title: updated.title },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Wardrobe PATCH error:', error);
    return NextResponse.json({ error: 'Error al actualizar el item' }, { status: 500 });
  }
}
