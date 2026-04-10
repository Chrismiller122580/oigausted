"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

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
    bio?: string
  }
}

export default function GigDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [gig, setGig] = useState<Gig | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const userStr = localStorage.getItem("oigausted-user")
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr))
      } catch (e) {}
    }

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

    const orderId = "order-" + Date.now()
    const newOrder = {
      id: orderId,
      gigTitle: gig.title,
      price: gig.price,
      status: "Pending",
      progress: 0,
      buyer: currentUser?.name || "Comprador",
      seller: gig.seller.name,
      gigId: gig.id,
      sellerId: gig.seller.id,
      createdAt: new Date().toISOString()
    }

    let savedOrders = JSON.parse(localStorage.getItem("oigausted-orders") || "[]")
    savedOrders.push(newOrder)
    localStorage.setItem("oigausted-orders", JSON.stringify(savedOrders))

    router.push(`/checkout/${orderId}`)
  }

  if (loading) return <div className="container py-12 text-center">Cargando gig...</div>
  if (!gig) return <div className="container py-12 text-center">Gig no encontrado</div>

  const isOwnGig = currentUser && gig.seller.id === currentUser.id

  return (
    <div className="container py-12 max-w-4xl mx-auto px-6">
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={() => router.back()} 
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          ← Volver
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image / Visual */}
        <div>
          {gig.imageUrl ? (
            <img 
              src={gig.imageUrl} 
              alt={gig.title}
              className="w-full rounded-3xl object-cover aspect-video"
            />
          ) : (
            <div className="w-full aspect-video bg-gray-200 rounded-3xl flex items-center justify-center">
              <span className="text-gray-500">Sin imagen</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-3">{gig.title}</h1>
            <p className="text-2xl font-semibold text-yellow-600">
              ${gig.price.toLocaleString('es-CO')}
            </p>
            <p className="text-gray-600 mt-2">Por {gig.seller.name}</p>
          </div>

          {gig.category && (
            <div className="inline-block px-4 py-2 bg-gray-100 rounded-full text-sm">
              {gig.category}
            </div>
          )}

          {gig.completionTime && (
            <p className="text-gray-600">Tiempo estimado de entrega: <span className="font-medium">{gig.completionTime}</span></p>
          )}

          <div>
            <h3 className="font-semibold mb-3">Descripción</h3>
            <p className="text-gray-700 leading-relaxed">{gig.description}</p>
          </div>

          {/* Seller Info */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Información del Vendedor</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-500 text-black rounded-full flex items-center justify-center font-bold text-xl">
                  {gig.seller.name?.charAt(0) || "V"}
                </div>
                <div>
                  <p className="font-medium">{gig.seller.name}</p>
                  <p className="text-sm text-gray-600">{gig.seller.email}</p>
                  {gig.seller.businessName && (
                    <p className="text-sm text-gray-600">{gig.seller.businessName}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            {isOwnGig ? (
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" asChild>
                <Link href={`/create-gig?edit=${gig.id}`}>Editar este Gig</Link>
              </Button>
            ) : (
              <Button 
                onClick={handleBuyNow}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white text-lg py-6"
              >
                Comprar Ahora - ${gig.price.toLocaleString('es-CO')}
              </Button>
            )}

            <Button variant="outline" className="flex-1 py-6" asChild>
              <Link href="/gigs">Ver otros Gigs</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
