import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notifications } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';
import { devLog } from '@/lib/utils';
import { normalizeGigImagePayload, parseGigImagesField } from '@/lib/gig-images';
import { notifyAdminsNewGig } from '@/lib/admin-notifications';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10) || 50))
    const skip = (page - 1) * limit

    const activeWhere = { isActive: true, deletedAt: null as null }
    let total = 0
    let gigs: Awaited<ReturnType<typeof prisma.gig.findMany>> = []

    try {
      total = await prisma.gig.count({ where: activeWhere })
      gigs = await prisma.gig.findMany({
        where: activeWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      })
    } catch (dbErr: unknown) {
      // Fallback during migration rollout if deletedAt column not yet added to DB
      const errMsg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      console.warn('[Public Gigs] deletedAt filter failed (column may not exist yet), fetching without it', errMsg);
      const fallbackWhere = { isActive: true }
      total = await prisma.gig.count({ where: fallbackWhere })
      gigs = await prisma.gig.findMany({
        where: fallbackWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      })
    }

    // Attach seller info defensively (some old rows may have dangling sellerId)
    const sellerIds = [...new Set(gigs.map((g: { sellerId: string }) => g.sellerId).filter((id: string | null | undefined): id is string => !!id))];
    const sellers = await prisma.user.findMany({
      where: { id: { in: sellerIds } },
      select: { 
        id: true, name: true, businessName: true,
        profilePicture: true, rating: true, reviewCount: true,
        latitude: true, longitude: true, serviceRadiusKm: true, city: true
      }
    });

    const sellerMap = Object.fromEntries(sellers.map((s: { id: string }) => [s.id, s]));

    const gigsWithSeller = gigs.map((gig: (typeof gigs)[number]) => ({
      ...gig,
      seller: sellerMap[gig.sellerId] || null
    }));

    devLog(`📦 /api/gigs returned ${gigs.length}/${total} gigs (page ${page})`);

    return NextResponse.json({
      gigs: gigsWithSeller || [],
      count: gigsWithSeller.length,
      total,
      page,
      limit,
      hasMore: skip + gigs.length < total,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    devLog("/api/gigs failed:", errMsg);
    return NextResponse.json({
      gigs: [],
      count: 0,
      error: errMsg
    }, { status: 500 });
  }
}

// POST - Create new gig (authenticated sellers)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
    }

    const role = session?.user?.role;
    if (role !== 'seller' && role !== 'admin') {
      return NextResponse.json({ error: "Solo vendedores pueden crear gigs" }, { status: 403 });
    }

    const sellerId = userId;

    const body = await req.json();
    const { 
      title, 
      description, 
      price, 
      category, 
      imageUrl,
      images,
      fields = [], 
      addons = [], 
      completionTime = "2-5 días",
      // Geolocation fields
      city,
      latitude,
      longitude,
      isRemote
    } = body;

    if (!title || !category || !price) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const imagePayload = normalizeGigImagePayload(
      images !== undefined ? parseGigImagesField(images) : undefined,
      imageUrl
    )

    const createData = {
        title,
        description: description || null,
        price: Number(price),
        category,
        imageUrl: imagePayload.imageUrl,
        images: imagePayload.images,
        fields: fields ? JSON.stringify(fields) : null,
        addons: addons ? JSON.stringify(addons) : null,
        completionTime,
        sellerId,
        // Geolocation
        city: city || null,
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
        isRemote: Boolean(isRemote),
    }

    let gig
    try {
      gig = await prisma.gig.create({ data: createData })
    } catch (dbErr: unknown) {
      const errMsg = dbErr instanceof Error ? dbErr.message : String(dbErr)
      if (errMsg.includes('images') && errMsg.includes('does not exist')) {
        const { images: _omit, ...dataWithoutImages } = createData
        gig = await prisma.gig.create({ data: dataWithoutImages })
      } else {
        throw dbErr
      }
    }

    devLog("✅ Gig created successfully:", gig.id);

    // Audit log for system change (seller action)
    await logAuditEvent({
      performedById: sellerId,
      action: 'GIG_CREATED',
      targetType: 'Gig',
      targetId: gig.id,
      details: { title, category, price: Number(price), isActive: true },
    });

    // Send confirmation to seller (non-fatal: do not fail the publish if notif/prefs fails due to transient DB issues)
    try {
      await notifications.sendInApp(
        sellerId,
        'gig',
        '¡Gig publicado exitosamente!',
        `Tu servicio "${title}" ya está visible para los compradores.`,
        `/seller/gigs`,
        { gigTitle: title, gigId: gig.id }
      );
    } catch (notifErr) {
      devLog("Gig created but failed to send confirmation notification (prefs or delivery issue):", notifErr);
    }

    try {
      const seller = await prisma.user.findUnique({
        where: { id: sellerId },
        select: { name: true, email: true, businessName: true },
      })
      await notifyAdminsNewGig({
        gigId: gig.id,
        title,
        category,
        price: Number(price),
        sellerName: seller?.businessName || seller?.name,
        sellerEmail: seller?.email,
      })
    } catch (adminErr) {
      devLog('Gig created but failed to notify admins:', adminErr)
    }

    return NextResponse.json({ 
      success: true, 
      gigId: gig.id,
      message: "Servicio publicado correctamente" 
    });

  } catch (error: unknown) {
    devLog("Error creating gig:", error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      error: "Error al guardar en la base de datos", 
      details
    }, { status: 500 });
  }
}
