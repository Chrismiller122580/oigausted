"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Star, Clock } from "lucide-react"

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
    rating?: number
    reviewCount?: number
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
  const sellerRating = gig.seller.rating || 0
  const reviewCount = gig.seller.reviewCount || 0

  return (
    <div className="container max-w-5xl mx-auto py-12 px-6">
      <Link href="/gigs" className="text-orange-600 hover:underline mb-8 inline-block">
        ← Volver a todos los gigs
      </Link>

      <div className="grid lg:grid-cols-5 gap-12">
        {/* Left: Image + Description */}
        <div className="lg:col-span-3">
          {gig.imageUrl && (
            <div className="rounded-3xl overflow-hidden mb-8">
              <img src={gig.imageUrl} alt={gig.title} className="w-full aspect-video object-cover" />
            </div>
          )}

          <h1 className="text-4xl font-bold mb-6">{gig.title}</h1>
          <p className="text-gray-700 leading-relaxed text-lg mb-10">{gig.description}</p>

          {gig.completionTime && (
            <div className="flex items-center gap-3 mb-8">
              <Clock className="w-6 h-6 text-gray-500" />
              <span className="text-lg">Entrega estimada: <strong>{gig.completionTime}</strong></span>
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-8 shadow-sm border sticky top-24">
            <div className="text-5xl font-bold text-orange-600 mb-2">
              ${gig.price.toLocaleString("es-CO")}
            </div>
            <p className="text-gray-500 mb-8">COP</p>

            {!isOwnGig && (
              <Button 
                onClick={handleBuyNow}
                size="lg"
                className="w-full py-7 text-lg bg-orange-600 hover:bg-orange-700 mb-6"
              >
                Comprar ahora
              </Button>
            )}

            {isOwnGig && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-2xl mb-6 text-center">
                Este es tu propio gig
              </div>
            )}

            {/* Seller Info */}
            <div className="border-t pt-6">
              <p className="text-sm text-gray-500 mb-2">Vendido por</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <p className="font-semibold">{gig.seller.businessName || gig.seller.name}</p>
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.floor(sellerRating) ? "fill-current" : ""}`} />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">({reviewCount})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
