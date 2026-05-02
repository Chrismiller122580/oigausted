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

    // Ensure the user exists in DB (upsert after DB reset)
    await prisma.user.upsert({
      where: { id: session.user.id },
      update: {},
      create: {
        id: session.user.id,
        name: session.user.name || 'Usuario',
        email: session.user.email || '',
        role: 'seller',
      }
    });

    const body = await request.json();

    const gig = await prisma.gig.create({
      data: {
        title: String(body.title || '').trim(),
        description: body.description ? String(body.description).trim() : null,
        price: parseFloat(body.price) || 0,
        category: String(body.category),
        imageUrl: body.imageUrl ? String(body.imageUrl) : null,
        completionTime: String(body.completionTime || '3'),
        fields: body.fields || {},
        sellerId: session.user.id,
      },
    });

    console.log("✅ Gig created successfully:", gig.id);
    return NextResponse.json({ success: true, gigId: gig.id, message: 'Gig creado exitosamente' });
  } catch (error: any) {
    console.error('Create gig error:', error);
    return NextResponse.json({ error: error.message || 'Error al crear el gig' }, { status: 500 });
  }
}

export async function GET() {
  const gigs = await prisma.gig.findMany({
    orderBy: { createdAt: 'desc' },
    include: { seller: { select: { id: true, name: true, businessName: true } } }
  });
  return NextResponse.json(gigs);
}
