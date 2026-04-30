import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Session user:", JSON.stringify(session?.user, null, 2));

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const body = await request.json();

    // Safety: Check if this sellerId actually exists in DB
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado en la base de datos. Por favor regístrate de nuevo.' }, { status: 400 });
    }

    const gig = await prisma.gig.create({
      data: {
        title: String(body.title).trim(),
        description: body.description ? String(body.description).trim() : null,
        price: parseFloat(body.price) || 0,
        category: String(body.category),
        imageUrl: body.imageUrl ? String(body.imageUrl) : null,
        completionTime: String(body.completionTime || '3'),
        fields: body.fields || {},
        sellerId: session.user.id,
      },
    });

    console.log("✅ Gig created:", gig.id);
    return NextResponse.json({ success: true, gig });

  } catch (error: any) {
    console.error('Create gig error:', error);
    return NextResponse.json({ error: error.message || 'Error al crear gig' }, { status: 500 });
  }
}

export async function GET() {
  const gigs = await prisma.gig.findMany({
    orderBy: { createdAt: 'desc' },
    include: { seller: { select: { id: true, name: true, businessName: true } } }
  });
  return NextResponse.json(gigs);
}
