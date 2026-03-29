import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, category, price, deliveryDays } = body

    // For now, just log and return success (we'll connect Prisma later)
    console.log("Gig submitted:", { title, description, category, price, deliveryDays })

    return NextResponse.json({ 
      success: true, 
      message: "Gig recibido correctamente (simulación)" 
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ 
      success: false, 
      error: "Error al procesar el gig" 
    }, { status: 500 })
  }
}
