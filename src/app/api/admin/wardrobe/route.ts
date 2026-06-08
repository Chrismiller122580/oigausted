import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (activeOnly) {
      where.isActive = true;
    }

    const items = await prisma.wardrobeItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Wardrobe GET error:', error);
    return NextResponse.json({ error: 'Error al cargar el catálogo' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: 'El título es requerido' }, { status: 400 });
    }

    const item = await prisma.wardrobeItem.create({
      data: {
        title: body.title,
        description: body.description || null,
        price: body.price ? parseFloat(body.price) : null,
        category: body.category || null,
        imageUrl: body.imageUrl || null,
        shopifyId: body.shopifyId || null,
        brand: body.brand || null,
        color: body.color || null,
        size: body.size || null,
        tags: body.tags || null,
        isActive: body.isActive !== false,
      },
    });

    const adminId = (session.user as any).id;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;

    await logAuditEvent({
      adminId,
      action: 'WARDROBE_ITEM_CREATED',
      targetType: 'WardrobeItem',
      targetId: item.id,
      details: { title: item.title, category: item.category },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Wardrobe POST error:', error);
    return NextResponse.json({ error: 'Error al crear el item' }, { status: 500 });
  }
}
