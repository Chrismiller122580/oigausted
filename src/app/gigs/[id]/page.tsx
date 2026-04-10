"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { useSession } from "next-auth/react"

interface Gig {
  id: string
  title: string
  description: string
  price: number
  category?: string
  completionTime?: string
  imageUrl?: string
  seller: {
    id: string
    name: string
    email: string
    businessName?: string
  }
}

export default function GigDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()

  const [gig, setGig] = useState<Gig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGig()
  }, [])

  const fetchGig = async () => {
    try {
      const res = await fetch(`/api/gigs/${params.id}`)
      if (!res.ok) throw new Error("Gig not found")
      const data = await res.json()
      setGig(data.gig)
    } catch (error) {
      console.error("Failed to fetch gig", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBuyNow = () => {
    if (!gig) return
    router.push(`/checkout/${gig.id}`)
  }

  if (loading) return <div className="container py-20 text-center">Cargando gig...</div>
  if (!gig) return <div className="container py-20 text-center">Gig no encontrado</div>

  const isOwnGig = session?.user && gig.seller.id === (session.user as any).id

  return (
    <div className="container max-w-4xl mx-auto py-12 px-6">
      <Link href="/gigs" className="text-orange-600 hover:underline mb-8 inline-block">
        ← Volver a todos los gigs
      </Link>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Image */}
        {gig.imageUrl && (
          <div className="rounded-3xl overflow-hidden">
            <img src={gig.imageUrl} alt={gig.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Details */}
        <div>
          <h1 className="text-4xl font-bold mb-4">{gig.title}</h1>
          <p className="text-gray-500 mb-6">por {gig.seller.name || gig.seller.businessName}</p>

          <div className="text-4xl font-bold text-orange-600 mb-8">
            ${gig.price.toLocaleString("es-CO")} COP
          </div>

          <p className="text-gray-700 leading-relaxed mb-10">{gig.description}</p>

          {gig.completionTime && (
            <p className="mb-6"><strong>Entrega:</strong> {gig.completionTime}</p>
          )}

          <Button 
            onClick={handleBuyNow}
            size="lg"
            className="w-full py-7 text-lg bg-orange-600 hover:bg-orange-700"
            disabled={isOwnGig}
          >
            {isOwnGig ? "Este es tu gig" : "Comprar ahora"}
          </Button>
        </div>
      </div>
    </div>
  )
}
