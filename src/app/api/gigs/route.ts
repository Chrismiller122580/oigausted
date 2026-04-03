import { NextRequest, NextResponse } from "next/server"

let gigs: any[] = [
  {
    id: "g1",
    title: "Diseño de Logo Profesional Moderno",
    description: "Logo único y profesional para tu marca. Incluye 3 revisiones, archivos fuente y versiones en color/blanco/negro.",
    price: 85000,
    category: "Diseño Gráfico",
    seller: "Demo Vendedor",
    deliveryDays: 3
  },
  {
    id: "g2",
    title: "Edición de Video para Redes Sociales",
    description: "Edito videos cortos para Instagram, TikTok y YouTube (hasta 60 segundos). Incluye música, texto y efectos.",
    price: 120000,
    category: "Producción Musical",
    seller: "Demo Vendedor",
    deliveryDays: 5
  },
  {
    id: "g3",
    title: "Limpieza Profunda de Apartamento",
    description: "Limpieza completa de apartamentos y casas en Bucaramanga. Incluye desinfección, ventanas y cocina.",
    price: 65000,
    category: "Otros Servicios",
    seller: "Demo Vendedor",
    deliveryDays: 1
  }
]

export async function GET() {
  return NextResponse.json(gigs)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const newGig = {
      id: "g" + Date.now(),
      title: body.title?.trim() || "Sin título",
      description: body.description?.trim() || "",
      price: parseFloat(body.price) || 0,
      category: body.category || "Otros",
      seller: "Demo Vendedor",
      deliveryDays: parseInt(body.deliveryDays || "3")
    }

    gigs.push(newGig)

    return NextResponse.json({ 
      success: true, 
      message: "Gig guardado correctamente",
      gig: newGig 
    })
  } catch (error) {
    console.error("Error saving gig:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Error al guardar el gig" 
    }, { status: 500 })
  }
}
