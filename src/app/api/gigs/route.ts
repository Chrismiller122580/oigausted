// src/app/api/gigs/route.ts - Fixed: removed unknown 'location' field
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión para publicar un gig' }, { status: 401 });
    }

    const body = await request.json();

    const {
      title,
      description,
      price,
      category,
      images = [],
      deliveryTime = '3',
      customFields = {},
      addons = [],
    } = body;

    const gig = await prisma.gig.create({
      data: {
        title: String(title || ''),
        description: description ? String(description) : null,
        price: parseFloat(price) || 0,
        category: category ? String(category) : null,
        imageUrl: images[0] ? String(images[0]) : null,
        completionTime: String(deliveryTime),
        fields: customFields || {},
        addons: Array.isArray(addons) ? addons : [],
        sellerId: session.user.id,
      },
    });

    console.log('✅ Gig created successfully:', gig.id);

    return NextResponse.json({ 
      success: true, 
      gigId: gig.id,
      message: 'Gig creado exitosamente' 
    });

  } catch (error: any) {
    console.error('Create gig error:', error);
    return NextResponse.json({ 
      error: error.message || 'Error al crear el gig. Revisa los datos.' 
    }, { status: 500 });
  }
}

export async function GET() {
  const gigs = await prisma.gig.findMany({
    orderBy: { createdAt: 'desc' },
    include: { seller: { select: { name: true, businessName: true } } }
  });
  return NextResponse.json(gigs);
}
