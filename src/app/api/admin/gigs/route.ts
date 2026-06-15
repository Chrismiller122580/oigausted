import { NextRequest, NextResponse } from 'next/server';
 import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { notifications } from '@/lib/notifications';
import type { Prisma } from '@prisma/client';
import type { JsonObject } from '@/types/json';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    const where: Prisma.GigWhereInput = {};
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { seller: { name: { contains: search } } },
        { seller: { email: { contains: search } } }
      ];
    }

    let gigs;
    try {
      gigs = await prisma.gig.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              businessName: true
            }
          },
          _count: {
            select: { orders: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
    } catch (dbErr: unknown) {
      // Defensive fallback: if the deletedAt column hasn't been migrated yet in the DB
      // (e.g. during rollout), fall back to fetching without the deletedAt filter.
      // This prevents the admin page from showing "no data".
      const errMsg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      console.warn('[Admin Gigs] deletedAt column not present yet, falling back to unfiltered query', errMsg);
      const fallbackWhere: Prisma.GigWhereInput = search ? {
        OR: [
          { title: { contains: search } },
          { seller: { name: { contains: search } } },
          { seller: { email: { contains: search } } }
        ]
      } : {};
      gigs = await prisma.gig.findMany({
        where: fallbackWhere,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              businessName: true
            }
          },
          _count: {
            select: { orders: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
    }

    const gigsWithStats = gigs.map((g: typeof gigs[number]) => ({
      ...g,
      orderCount: g._count.orders
    }));

    return NextResponse.json({ gigs: gigsWithStats });
  } catch (error) {
    console.error('Admin gigs error:', error);
    return NextResponse.json({ error: 'Error loading gigs' }, { status: 500 });
  }
}

// PATCH for moderation actions (full edit, isActive toggle, soft delete/restore)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session) || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { gigId, isActive, deletedAt, title, price, description, category, completionTime, imageUrl, fields, addons, city, latitude, longitude, isRemote } = body;

    if (!gigId) {
      return NextResponse.json({ error: 'gigId is required' }, { status: 400 });
    }

    const data: Prisma.GigUpdateInput = {};
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    if (deletedAt !== undefined) data.deletedAt = deletedAt ? new Date(deletedAt) : null;
    if (title !== undefined) data.title = title;
    if (price !== undefined) data.price = Number(price);
    if (description !== undefined) data.description = description || null;
    if (category !== undefined) data.category = category || null;
    if (completionTime !== undefined) data.completionTime = completionTime || null;
    if (imageUrl !== undefined) data.imageUrl = imageUrl || null;
    if (fields !== undefined) data.fields = fields ? (typeof fields === 'string' ? fields : JSON.stringify(fields)) : null;
    if (addons !== undefined) data.addons = addons ? (typeof addons === 'string' ? addons : JSON.stringify(addons)) : null;
    if (city !== undefined) data.city = city || null;
    if (latitude !== undefined) data.latitude = latitude != null ? Number(latitude) : null;
    if (longitude !== undefined) data.longitude = longitude != null ? Number(longitude) : null;
    if (isRemote !== undefined) data.isRemote = Boolean(isRemote);

    const updated = await prisma.gig.update({
      where: { id: gigId },
      data
    });

    // Log moderation action
    const adminId = session.user.id;
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
    const userAgent = req.headers.get('user-agent') || null;

    let action = 'GIG_UPDATED';
    if (deletedAt !== undefined) action = deletedAt ? 'GIG_DELETED' : 'GIG_RESTORED';
    else if (isActive !== undefined) action = isActive ? 'GIG_ACTIVATED' : 'GIG_DEACTIVATED';

    await logAuditEvent({
      adminId,
      action,
      targetType: 'Gig',
      targetId: gigId,
      details: { ...data } as JsonObject,
      ipAddress,
      userAgent,
    });

    // Send in-app notification to seller for key actions
    if (deletedAt !== undefined || isActive !== undefined) {
      await notifications.sendInApp(
        updated.sellerId,
        'gig',
        deletedAt ? 'Tu gig ha sido eliminado' : (isActive ? 'Tu gig ha sido activado' : 'Tu gig ha sido pausado'),
        deletedAt ? `El servicio "${updated.title}" ha sido eliminado por un administrador.` : `El servicio "${updated.title}" ha cambiado de estado.`,
        `/seller/gigs`
      );
    }

    return NextResponse.json({ success: true, gig: updated });
  } catch (error) {
    console.error('Admin gig update error:', error);
    return NextResponse.json({ error: 'Error updating gig' }, { status: 500 });
  }
}

// DELETE gig (admin moderation) - now performs soft delete to support restore
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session) || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { gigId } = await req.json();

    if (!gigId) {
      return NextResponse.json({ error: 'gigId is required' }, { status: 400 });
    }

    // Fetch gig for notification and audit
    const gigToDelete = await prisma.gig.findUnique({
      where: { id: gigId },
      select: { sellerId: true, title: true }
    });

    if (!gigToDelete) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    }

    const now = new Date();

    const updated = await prisma.gig.update({
      where: { id: gigId },
      data: { deletedAt: now }
    });

    const adminId = session.user.id;
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
    const userAgent = req.headers.get('user-agent') || null;
    await logAuditEvent({
      adminId,
      action: 'GIG_DELETED',
      targetType: 'Gig',
      targetId: gigId,
      details: { deletedAt: now.toISOString() },
      ipAddress,
      userAgent,
    });

    if (gigToDelete?.sellerId) {
      await notifications.sendInApp(
        gigToDelete.sellerId,
        'gig',
        'Tu gig ha sido eliminado',
        `El servicio "${gigToDelete.title}" ha sido eliminado por un administrador.`,
        `/seller/gigs`
      );
    }

    return NextResponse.json({ success: true, gig: updated });
  } catch (error) {
    console.error('Admin gig delete error:', error);
    return NextResponse.json({ error: 'Error deleting gig' }, { status: 500 });
  }
}
