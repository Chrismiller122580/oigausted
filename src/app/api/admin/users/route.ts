import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { requireAdminFromDb, requireAdminPanelSession } from '@/lib/admin-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { devLog, slugify } from '@/lib/utils';
import { logAuditEvent } from '@/lib/audit';
import { notifications } from '@/lib/notifications';
import { onlineSinceDate } from '@/lib/presence';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminPanelSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get('role');
    const activeFilter = searchParams.get('active'); // 'true' | 'false'
    const onlineFilter = searchParams.get('online') === 'true';
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10) || 200, 200);

    const isStaffFilter = roleFilter === 'accountant' || roleFilter === 'admin_assistant';

    const where: Prisma.UserWhereInput = {
      ...(isStaffFilter
        ? { staffRole: roleFilter }
        : roleFilter
          ? { role: roleFilter }
          : {}),
      ...(activeFilter ? { isActive: activeFilter === 'true' } : {}),
      ...(onlineFilter ? { lastActiveAt: { gte: onlineSinceDate() } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { businessName: { contains: search } },
              // Exact id match when staff pastes a cuid/uuid
              { id: search },
            ],
          }
        : {}),
    };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        staffRole: true,
        businessName: true,
        // slug: true, // omitted for prod DB compatibility until migration
        phone: true,
        whatsapp: true,
        tagline: true,
        instagram: true,
        facebook: true,
        city: true,
        address: true,
        referralCode: true,
        bio: true,
        nit: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        rating: true,
        reviewCount: true,
        lastLoginAt: true,
        lastLoginIp: true,
        lastLoginCity: true,
        lastLoginUserAgent: true,
        lastActiveAt: true,
        contactViolationCount: true,
        contactFlaggedAt: true,
        customReferralRate: true,
        _count: {
          select: {
            gigs: true,
            ordersAsBuyer: true,
            ordersAsSeller: true,
            referrals: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
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
    const session = await requireAdminFromDb();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { 
      userId, 
      role,
      staffRole,
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
      customReferralRate,
      marketingStudio,
    } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    const VALID_ROLES = ['buyer', 'seller', 'admin'] as const;
    const VALID_STAFF_ROLES = ['accountant', 'admin_assistant', 'analytics'] as const;
    if (role && !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Rol de marketplace no válido' }, { status: 400 });
    }
    if (staffRole !== undefined && staffRole !== null && staffRole !== '' && !VALID_STAFF_ROLES.includes(staffRole)) {
      return NextResponse.json({ error: 'Rol de staff no válido' }, { status: 400 });
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
      ...(staffRole !== undefined && {
        staffRole: staffRole === '' || staffRole === null ? null : staffRole,
      }),
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

    let marketingSubscriptionResult = null;
    if (marketingStudio && typeof marketingStudio === 'object') {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (targetUser?.role === 'seller' || targetUser?.role === 'admin') {
        const ms = marketingStudio as {
          enabled?: boolean;
          adminOverride?: string | null;
          adminNote?: string | null;
        };
        const overrideVal =
          ms.adminOverride === '' || ms.adminOverride === 'auto' || ms.adminOverride === null
            ? null
            : ms.adminOverride;
        const validOverrides = new Set(['pro', 'free', 'blocked', null]);
        if (overrideVal !== undefined && !validOverrides.has(overrideVal as null)) {
          return NextResponse.json({ error: 'adminOverride no válido' }, { status: 400 });
        }
        try {
          marketingSubscriptionResult = await prisma.sellerMarketingSubscription.upsert({
            where: { userId },
            create: {
              userId,
              enabled: ms.enabled ?? true,
              adminOverride: overrideVal ?? null,
              adminNote: ms.adminNote ?? null,
              updatedByAdminId: session.user.id,
            },
            update: {
              ...(ms.enabled !== undefined && { enabled: ms.enabled }),
              ...(overrideVal !== undefined && { adminOverride: overrideVal }),
              ...(ms.adminNote !== undefined && { adminNote: ms.adminNote }),
              updatedByAdminId: session.user.id,
            },
          });
        } catch (subErr) {
          devLog('Marketing subscription upsert failed (table may be missing):', subErr);
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
          staffRole: true,
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
            id: true, name: true, tagline: true, email: true, role: true, staffRole: true, businessName: true,
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
    if (marketingSubscriptionResult) action = 'MARKETING_STUDIO_ADMIN_UPDATE';
    else if (role || staffRole !== undefined) action = 'USER_ROLE_CHANGED';
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
          ...(staffRole !== undefined && { staffRole }),
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
    if (role || staffRole !== undefined) {
      const parts = [];
      if (role) parts.push(`marketplace: ${role}`);
      if (staffRole !== undefined) {
        parts.push(`staff: ${staffRole || 'ninguno'}`);
      }
      await notifications.sendInApp(
        userId,
        'system',
        'Tu rol ha sido actualizado',
        `Tu cuenta ahora tiene ${parts.join(', ')}.`,
        `/profile`
      );
    }

    return NextResponse.json({
      success: true,
      user: updated,
      marketingSubscription: marketingSubscriptionResult,
    });
  } catch (error) {
    devLog('Admin user update error:', error);
    return NextResponse.json({ error: 'Error actualizando usuario' }, { status: 500 });
  }
}

// DELETE user (admin only, with safeguards)
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdminFromDb();
    if (!session?.user?.id) {
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
