import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión como vendedor' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, price, category, imageUrl, completionTime = '3', fields = {} } = body;

    if (!title || !price || !category) {
      return NextResponse.json({ error: 'Título, precio y categoría son obligatorios' }, { status: 400 });
    }

    const gig = await prisma.gig.create({
      data: {
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        price: parseFloat(price) || 0,
        category: String(category),
        imageUrl: imageUrl ? String(imageUrl) : null,
        completionTime: String(completionTime),
        fields: fields || {},
        sellerId: session.user.id,   // Explicit sellerId
      },
    });

    return NextResponse.json({ success: true, gig, message: 'Gig creado exitosamente' });
  } catch (error: any) {
    console.error('Create gig error:', error);
    return NextResponse.json({ error: error.message || 'Error al crear el gig' }, { status: 500 });
  }
}

export async function GET() {
  const gigs = await prisma.gig.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      seller: {
        select: { id: true, name: true, businessName: true, rating: true, reviewCount: true }
      }
    }
  });
  return NextResponse.json(gigs);
}
