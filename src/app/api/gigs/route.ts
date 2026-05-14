import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
    }

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
        description,
        price: Number(price),
        category,
        imageUrl: imageUrl || null,
        fields: fields,
        addons: addons,
        completionTime,
        sellerId: session.user.id,
      },
    });

    console.log("✅ Gig created successfully:", gig.id);

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
