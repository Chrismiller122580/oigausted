"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Star, Clock } from "lucide-react"

interface Gig {
  id: string
  title: string
  description: string
  price: number
  category?: string
  deliveryTime?: string
  imageUrl?: string
  fields?: Record<string, any>
  seller: {
    id: string
    name: string
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Cargando gig...</div>
  if (!gig) return <div className="min-h-screen flex items-center justify-center text-red-600">Gig no encontrado</div>

  const isOwnGig = session?.user && gig.seller.id === (session.user as any).id

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <Link href="/gigs" className="text-emerald-600 hover:underline mb-8 inline-block">
          ← Volver a todos los gigs
        </Link>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-10">
            {gig.imageUrl && (
              <div className="rounded-3xl overflow-hidden shadow-xl">
                <img src={gig.imageUrl} alt={gig.title} className="w-full aspect-video object-cover" />
              </div>
            )}

            <div>
              <h1 className="text-5xl font-bold tracking-tight mb-4">{gig.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                {gig.category && <span className="font-medium bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full">{gig.category}</span>}
                {gig.deliveryTime && (
                  <div className="flex items-center gap-1.5 bg-white px-4 py-1 rounded-full border">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium">Entrega en {gig.deliveryTime}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Descripción</h2>
              <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">{gig.description || "Sin descripción"}</p>
            </div>

            {/* Tailored Fields */}
            {gig.fields && Object.keys(gig.fields).length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Detalles específicos del servicio</h2>
                <div className="grid gap-4">
                  {Object.entries(gig.fields).map(([key, value]) => (
                    <div key={key} className="bg-white p-6 rounded-3xl border">
                      <p className="text-sm uppercase tracking-widest text-gray-500 mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-lg font-medium text-gray-900">{value || "No especificado"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Buy Box */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-8 shadow-sm border sticky top-8">
              <div className="text-6xl font-bold text-emerald-600 mb-1">
                ${gig.price.toLocaleString("es-CO")}
              </div>
              <p className="text-gray-500 mb-10">COP</p>

              {!isOwnGig && (
                <Button 
                  onClick={handleBuyNow} 
                  size="lg" 
                  className="w-full py-8 text-xl bg-emerald-600 hover:bg-emerald-700 rounded-3xl font-semibold mb-8"
                >
                  Comprar ahora
                </Button>
              )}

              {isOwnGig && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-6 rounded-3xl mb-8 text-center font-medium">
                  Este es tu propio gig • No puedes comprarlo
                </div>
              )}

              {/* Seller Info */}
              <div className="border-t pt-8">
                <p className="text-sm text-gray-500 mb-3">Vendido por</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl">
                    👤
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{gig.seller.businessName || gig.seller.name}</p>
                    {gig.seller.rating && (
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-5 h-5 ${i < Math.floor(gig.seller.rating!) ? "fill-current" : ""}`} />
                        ))}
                        <span className="text-sm text-gray-600 ml-2">
                          ({gig.seller.reviewCount || 0} reseñas)
                        </span>
                      </div>
                    )}
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