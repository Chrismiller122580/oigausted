import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions, resolveDemoUserId } from '@/lib/auth';
import { notifications } from '@/lib/notifications';

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

    console.log(`📦 /api/gigs returned ${gigs.length} gigs with full seller info`);

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
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
    }

    const sellerId = resolveDemoUserId(session.user.id);

    const body = await req.json();
    const { 
      title, 
      description, 
      price, 
      category, 
      imageUrl, 
      fields = [], 
      addons = [], 
      completionTime = "2-5 días" 
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
      },
    });

    console.log("✅ Gig created successfully:", gig.id);

    // Send confirmation to seller
    await notifications.sendInApp(
      sellerId,
      'gig',
      '¡Gig publicado exitosamente!',
      `Tu servicio "${title}" ya está visible para los compradores.`,
      `/seller/gigs`
    );

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
>>>>>>> feat/wompi
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - Please login as seller" }, { status: 401 });
    }

    const body = await request.json();

    const gig = await prisma.gig.create({
      data: {
        title: body.title,
        description: body.description || null,
        price: parseFloat(body.price),
        category: body.category,
        completionTime: body.completionTime || "2-5 días",
        imageUrl: body.imageUrl || null,
        fields: body.fields || null,
        addons: body.addons || null,
        sellerId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, gig });
  } catch (error: any) {
    console.error("Error creating gig:", error);
    return NextResponse.json({ error: error.message || "Failed to create gig" }, { status: 500 });
  }
}
