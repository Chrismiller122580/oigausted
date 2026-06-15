import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { devLog, slugify } from '@/lib/utils';
import { logAuditEvent } from '@/lib/audit';
import { notifications } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
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
        // slug: true, // omitted for prod DB compatibility until migration
        phone: true,
        whatsapp: true,

        bio: true,
        nit: true,
        isActive: true,
        createdAt: true,
        rating: true,
        reviewCount: true,
        customReferralRate: true,
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
    devLog('Admin users error:', error);
    return NextResponse.json({ error: 'Error cargando usuarios' }, { status: 500 });
  }
}

// PATCH - Update user role or basic fields (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session) || !session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { 
      userId, 
      role, 
      name, 
      email,
      tagline,
      businessName, 
      phone, 
      whatsapp, 
      instagram,
      facebook,
      city, 
      latitude,
      longitude,
      serviceRadiusKm,
      bio,
      nit,
      isActive,
      customReferralRate 
    } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    // Email uniqueness check if changing email
    if (email) {
      const existing = await prisma.user.findUnique({ 
        where: { email: email.toLowerCase().trim() },
        select: { id: true }
      });
      if (existing && existing.id !== userId) {
        return NextResponse.json({ error: 'Ese email ya está en uso por otro usuario' }, { status: 400 });
      }
    }

    // Prevent removing the last admin (would lock out admin access)
    if (role && role !== 'admin') {
      const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (target?.role === 'admin') {
        const adminCount = await prisma.user.count({ where: { role: 'admin' } });
        if (adminCount <= 1) {
          return NextResponse.json({ error: 'No se puede eliminar el último administrador del sistema' }, { status: 400 });
        }
      }
    }

    const updateData: import('@prisma/client').Prisma.UserUpdateInput = {
      ...(role && { role }),
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email: email.toLowerCase().trim() }),
      ...(tagline !== undefined && { tagline }),
      ...(phone !== undefined && { phone }),
      ...(whatsapp !== undefined && { whatsapp }),
      ...(instagram !== undefined && { instagram }),
      ...(facebook !== undefined && { facebook }),

      ...(bio !== undefined && { bio }),
      ...(nit !== undefined && { nit }),
      ...(city !== undefined && { city }),
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      ...(serviceRadiusKm !== undefined && { serviceRadiusKm }),
      ...(isActive !== undefined && { isActive }),
      ...(customReferralRate !== undefined && { customReferralRate: customReferralRate === '' || customReferralRate == null ? null : parseFloat(customReferralRate) }),
    };

    let slugSafe = false;
    if (businessName !== undefined) {
      const trimmed = (businessName || '').trim();
      updateData.businessName = trimmed || null;

      if (trimmed) {
        let slug = slugify(trimmed);
        if (slug) {
          let candidate = slug;
          let suffix = 1;
          while (true) {
            let exists = null;
            try {
              exists = await prisma.user.findUnique({
                where: { slug: candidate },
                select: { id: true }
              });
              slugSafe = true;
            } catch (e) {
              devLog('slug check skipped (possible missing column in prod DB)');
              slugSafe = false;
            }
            if (!exists || exists.id === userId) {
              slug = candidate;
              break;
            }
            candidate = `${slug}-${suffix++}`;
            if (suffix > 50) {
              candidate = `${slug}-${Date.now().toString(36)}`;
              break;
            }
          }
        }
        if (slugSafe) {
          updateData.slug = slug || null;
        }
      } else {
        if (slugSafe) {
          updateData.slug = null;
        }
      }
    }

    let updated;
    try {
      updated = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: { 
          id: true, 
          name: true, 
          tagline: true,
          email: true, 
          role: true, 
          businessName: true,
          // slug: true, // omitted for prod DB compatibility until migration
          phone: true,
          whatsapp: true,
          instagram: true,
          facebook: true,

          bio: true,
          nit: true,
          city: true,
          latitude: true,
          longitude: true,
          serviceRadiusKm: true,
          customReferralRate: true
        }
      });
    } catch (updateErr: unknown) {
      const msg = updateErr instanceof Error ? updateErr.message : String(updateErr);
      if (msg.includes('slug') && updateData.slug !== undefined) {
        devLog('Retrying admin user update without slug field (prod DB missing column)');
        delete updateData.slug;
        updated = await prisma.user.update({
          where: { id: userId },
          data: updateData,
          select: { 
            id: true, name: true, tagline: true, email: true, role: true, businessName: true,
            phone: true, whatsapp: true, instagram: true, facebook: true,
            bio: true, nit: true, city: true, latitude: true, longitude: true,
            serviceRadiusKm: true, customReferralRate: true
          }
        });
      } else {
        throw updateErr;
      }
    }

    // Log the action (with request metadata + smarter action type)
    const adminId = session.user.id;
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
    const userAgent = req.headers.get('user-agent') || null;

    // Choose more specific action when possible (matches schema examples + better filtering on audit page)
    let action = 'USER_UPDATED';
    if (role) action = 'USER_ROLE_CHANGED';
    else if (isActive !== undefined) action = isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED';
    else if (customReferralRate !== undefined) action = 'USER_REFERRAL_RATE_UPDATED';

    await logAuditEvent({
      adminId,
      action,
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
          ...(customReferralRate !== undefined && { customReferralRate }),
        }),
      },
      ipAddress,
      userAgent,
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
    devLog('Admin user update error:', error);
    return NextResponse.json({ error: 'Error actualizando usuario' }, { status: 500 });
  }
}

// DELETE user (admin only, with safeguards)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session) || !session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    // Don't allow self-delete
    const adminId = session.user.id;
    if (userId === adminId) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
    }

    // Check for activity
    const [gigCount, buyerOrders, sellerOrders] = await Promise.all([
      prisma.gig.count({ where: { sellerId: userId } }),
      prisma.order.count({ where: { buyerId: userId } }),
      prisma.order.count({ where: { sellerId: userId } }),
    ]);

    const hasActivity = gigCount > 0 || buyerOrders > 0 || sellerOrders > 0;

    // Prevent deleting the last admin
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, isActive: true } });
    if (target?.role === 'admin') {
      const adminCount = await prisma.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'No se puede eliminar el último administrador' }, { status: 400 });
      }
    }

    if (hasActivity) {
      // Instead of hard delete, deactivate the user (soft delete)
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false }
      });

      await logAuditEvent({
        adminId,
        action: 'USER_DEACTIVATED',
        targetType: 'User',
        targetId: userId,
        details: { reason: 'delete_attempt_with_activity', gigCount, buyerOrders, sellerOrders },
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null,
        userAgent: req.headers.get('user-agent') || null,
      });

      return NextResponse.json({ 
        success: true, 
        deactivatedInstead: true,
        message: `Usuario tiene actividad: ${gigCount} gigs, ${buyerOrders} órdenes como comprador, ${sellerOrders} como vendedor. Fue desactivado en su lugar.` 
      });
    }

    // No activity - safe to hard delete
    await prisma.user.delete({ where: { id: userId } });

    await logAuditEvent({
      adminId,
      action: 'USER_DELETED',
      targetType: 'User',
      targetId: userId,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null,
      userAgent: req.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    devLog('Admin user delete error:', error);
    return NextResponse.json({ error: 'Error eliminando usuario' }, { status: 500 });
  }
}
