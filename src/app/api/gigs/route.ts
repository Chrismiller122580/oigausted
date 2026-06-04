import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// @ts-ignore
// @ts-ignore
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notifications } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';
import { devLog } from '@/lib/utils';

export async function GET() {
  try {
    const gigs = await prisma.gig.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    // Attach seller info defensively (some old rows may have dangling sellerId)
    const sellerIds = [...new Set(gigs.map(g => g.sellerId))];
    const sellers = await prisma.user.findMany({
      where: { id: { in: sellerIds } },
      select: { 
        id: true, name: true, email: true, businessName: true, 
        profilePicture: true, rating: true, reviewCount: true,
        latitude: true, longitude: true, serviceRadiusKm: true, city: true
      }
    });

    const sellerMap = Object.fromEntries(sellers.map(s => [s.id, s]));

    const gigsWithSeller = gigs.map(gig => ({
      ...gig,
      seller: sellerMap[gig.sellerId] || null
    }));

    devLog(`📦 /api/gigs returned ${gigs.length} gigs with full seller info`);

    return NextResponse.json({
      gigs: gigsWithSeller || [],
      count: gigsWithSeller.length
    });
  } catch (error: any) {
    console.error("❌ /api/gigs failed:", error.message);
    return NextResponse.json({
      gigs: [],
      count: 0,
      error: error.message
    }, { status: 500 });
  }
}

// POST - Create new gig (authenticated sellers)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
    }

    const role = (session?.user as any)?.role;
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

    const gig = await prisma.gig.create({
      data: {
        title,
        description: description || null,
        price: Number(price),
        category,
        imageUrl: imageUrl || null,
        fields: fields ? JSON.stringify(fields) : null,
        addons: addons ? JSON.stringify(addons) : null,
        completionTime,
        sellerId,
        // Geolocation
        city: city || null,
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
        isRemote: Boolean(isRemote),
      },
    });

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
        { gigTitle: title }
      );
    } catch (notifErr) {
      console.error("⚠️ Gig created but failed to send confirmation notification (prefs or delivery issue):", notifErr);
    }

    return NextResponse.json({ 
      success: true, 
      gigId: gig.id,
      message: "Servicio publicado correctamente" 
    });

  } catch (error: any) {
    console.error("❌ Error creating gig:", error);
    return NextResponse.json({ 
      error: "Error al guardar en la base de datos", 
      details: error.message 
    }, { status: 500 });
  }
}
