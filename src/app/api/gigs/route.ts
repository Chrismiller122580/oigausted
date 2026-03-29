import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const dbPath = path.join(process.cwd(), "data", "gigs.json")

// Create data folder if it doesn't exist
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
}

function loadGigs() {
  if (fs.existsSync(dbPath)) {
    try {
      return JSON.parse(fs.readFileSync(dbPath, "utf8"))
    } catch {
      return []
    }
  }
  return []
}

function saveGigs(gigs: any[]) {
  fs.writeFileSync(dbPath, JSON.stringify(gigs, null, 2))
}

let gigs = loadGigs()

export async function GET() {
  return NextResponse.json({ gigs })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, category, price, deliveryDays } = body

    const newGig = {
      id: Date.now().toString(),
      title: title || "Sin título",
      description: description || "",
      category: category || "Otros Servicios",
      price: parseFloat(price) || 0,
      seller: "Demo Vendedor",
      createdAt: new Date().toISOString(),
    }

    gigs.unshift(newGig)
    saveGigs(gigs)

    console.log("✅ Gig saved to JSON file:", newGig.title)

    return NextResponse.json({ 
      success: true, 
      gig: newGig 
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ 
      success: false, 
      error: "Error al guardar el gig" 
    }, { status: 500 })
  }
}
