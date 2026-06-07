import { NextResponse } from 'next/server';
// @ts-ignore
// @ts-ignore
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name || undefined,
        tagline: data.tagline || undefined,
        profilePicture: data.imageUrl || undefined,
        businessName: data.businessName || undefined,
        bio: data.bio || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        instagram: data.instagram || null,
        facebook: data.facebook || null,
        city: data.city || undefined,
        latitude: data.latitude ?? undefined,
        longitude: data.longitude ?? undefined,
        serviceRadiusKm: data.serviceRadiusKm ?? undefined,
      },
    });

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    });

  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 });
  }
}
