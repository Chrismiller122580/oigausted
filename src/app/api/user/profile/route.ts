import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name || undefined,
        image: data.imageUrl || undefined,
        
        // New fields from enhanced profile
        tagline: data.tagline || null,
        bio: data.bio || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        city: data.city || null,
        instagram: data.instagram || null,
        facebook: data.facebook || null,

        // Keep old fields for compatibility
        idNumber: data.idNumber || undefined,
        address: data.address || undefined,
      },
      select: {
        id: true,
        name: true,
        image: true,
        tagline: true,
        bio: true,
        phone: true,
        whatsapp: true,
        city: true,
        instagram: true,
        facebook: true,
        idNumber: true,
        address: true,
        role: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    });

  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ 
      error: 'Error al actualizar perfil',
      details: error.message 
    }, { status: 500 });
  }
}
