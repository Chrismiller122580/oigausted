import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
