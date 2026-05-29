import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { notifications } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get('role');
    const activeFilter = searchParams.get('active'); // 'true' | 'false'

    const users = await prisma.user.findMany({
      where: {
        ...(roleFilter && { role: roleFilter }),
        ...(activeFilter && { isActive: activeFilter === 'true' }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        businessName: true,
        phone: true,
        whatsapp: true,

        bio: true,
        nit: true,
        isActive: true,
        createdAt: true,
        rating: true,
        reviewCount: true,
        _count: {
          select: {
            gigs: true,
            ordersAsBuyer: true,
            ordersAsSeller: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Error cargando usuarios' }, { status: 500 });
  }
}

// PATCH - Update user role or basic fields (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { 
      userId, 
      role, 
      name, 
      businessName, 
      phone, 
      whatsapp, 
      city, 
      bio,
      nit,
      isActive 
    } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role && { role }),
        ...(name !== undefined && { name }),
        ...(businessName !== undefined && { businessName }),
        ...(phone !== undefined && { phone }),
        ...(whatsapp !== undefined && { whatsapp }),

        ...(bio !== undefined && { bio }),
        ...(nit !== undefined && { nit }),
        ...(isActive !== undefined && { isActive }),
      },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        businessName: true,
        phone: true,
        whatsapp: true,

        bio: true,
        nit: true
      }
    });

    // Log the action
    const adminId = (session.user as any).id;
    await logAuditEvent({
      adminId,
      action: 'USER_UPDATED',
      targetType: 'User',
      targetId: userId,
      details: {
        changedFields: Object.keys({
          ...(role && { role }),
          ...(name !== undefined && { name }),
          ...(businessName !== undefined && { businessName }),
          ...(phone !== undefined && { phone }),
          ...(whatsapp !== undefined && { whatsapp }),
  
          ...(bio !== undefined && { bio }),
          ...(nit !== undefined && { nit }),
          ...(isActive !== undefined && { isActive }),
        }),
      },
    });

    // Notify the affected user if their role changed
    if (role) {
      await notifications.sendInApp(
        userId,
        'system',
        'Tu rol ha sido actualizado',
        `Tu cuenta ahora tiene el rol de ${role}.`,
        `/profile`
      );
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json({ error: 'Error actualizando usuario' }, { status: 500 });
  }
}
