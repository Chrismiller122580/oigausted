import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const gigs = await prisma.gig.findMany({
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            businessName: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📦 API returned ${gigs.length} gigs to buyers`);

    return NextResponse.json({ 
      gigs: gigs || [],
      count: gigs.length 
    });
  } catch (error) {
    console.error("❌ Error fetching gigs:", error);
    return NextResponse.json({ 
      gigs: [],
      error: "Failed to load gigs" 
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
