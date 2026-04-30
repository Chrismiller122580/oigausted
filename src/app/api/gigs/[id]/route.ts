import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const gig = await prisma.gig.findUnique({
      where: { id: params.id },
      include: {
        seller: {
          select: { 
            id: true, 
            name: true, 
            businessName: true 
          }
        }
      }
    });

    if (!gig) {
      return NextResponse.json({ error: 'Gig no encontrado' }, { status: 404 });
    }

    return NextResponse.json(gig);
  } catch (error) {
    console.error('Get gig error:', error);
    return NextResponse.json({ error: 'Error al cargar el gig' }, { status: 500 });
  }
}
