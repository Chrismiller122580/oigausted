"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { useToast } from "@/components/ToastProvider"

interface Gig {
  id: string
  title: string
  description: string
  price: number
  category: string
  seller: string
}

interface Order {
  id: string
  gigTitle: string
  price: number
  status: string
  seller: string
  buyer?: string
  rating?: number
  reviewComment?: string
}

export default function SellerDashboard() {
  const router = useRouter()
  const { showToast } = useToast()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [myGigs, setMyGigs] = useState<Gig[]>([])
  const [mySales, setMySales] = useState<Order[]>([])
  const [averageRating, setAverageRating] = useState<number>(0)
  const [totalReviews, setTotalReviews] = useState<number>(0)

  useEffect(() => {
    const userStr = localStorage.getItem("oigausted-user")
    if (!userStr) {
      router.push("/login")
      return
    }

    const user = JSON.parse(userStr)
    setCurrentUser(user)

    if (user.role !== "seller") {
      showToast("Esta página es solo para vendedores.", "error")
      router.push("/profile")
      return
    }

    // Load seller's gigs
    const savedGigs = localStorage.getItem("oigausted-gigs")
    if (savedGigs) {
      const allGigs: Gig[] = JSON.parse(savedGigs)
      const sellerGigs = allGigs.filter(g => g.seller === user.name)
      setMyGigs(sellerGigs)
    }

    // Load completed sales with ratings
    const savedOrders = localStorage.getItem("oigausted-orders")
    if (savedOrders) {
      const allOrders: Order[] = JSON.parse(savedOrders)
      const sales = allOrders.filter(o => 
        o.seller === user.name && 
        o.status === "Completed" && 
        o.rating !== undefined
      )
      setMySales(sales)

      // Calculate average rating
      if (sales.length > 0) {
        const totalStars = sales.reduce((sum, o) => sum + (o.rating || 0), 0)
        const avg = totalStars / sales.length
        setAverageRating(Math.round(avg * 10) / 10)
        setTotalReviews(sales.length)
      }
    }
  }, [router, showToast])

  const renderStars = (rating: number = 0) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? "text-yellow-500" : "text-gray-300"}>
        ★
      </span>
    ))
  }

  if (!currentUser || currentUser.role !== "seller") {
    return <div className="container py-12 text-center">Cargando...</div>
  }

  return (
    <div className="container mx-auto py-12 px-6">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold">Panel de Vendedor</h1>
          <p className="text-gray-600 mt-2">Bienvenido, {currentUser.name}</p>
        </div>
        <Button onClick={() => router.push("/profile")}>Volver a Mi Perfil</Button>
      </div>

      {/* Average Rating Card */}
      <div className="bg-white border rounded-3xl p-10 mb-12 text-center">
        <div className="text-7xl font-bold text-yellow-600 mb-4">
          {averageRating > 0 ? averageRating : "—"}
        </div>
        <div className="flex justify-center gap-1 text-5xl mb-6">
          {renderStars(averageRating)}
        </div>
        <p className="text-2xl text-gray-700">
          {totalReviews > 0 
            ? `${totalReviews} calificaciones recibidas` 
            : "Aún no tienes calificaciones"}
        </p>
        {totalReviews > 0 && (
          <p className="text-green-600 mt-3">¡Sigue así! Tu reputación está creciendo.</p>
        )}
      </div>

      {/* My Gigs */}
      <div className="mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Mis Gigs Publicados ({myGigs.length})</h2>
          <Button asChild>
            <a href="/create-gig">+ Nuevo Gig</a>
          </Button>
        </div>

        {myGigs.length === 0 ? (
          <div className="text-center py-16 border rounded-3xl text-gray-500">
            No has publicado ningún gig todavía.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGigs.map((gig) => (
              <div key={gig.id} className="bg-white border rounded-3xl p-8 hover:shadow-md transition-all">
                <h3 className="font-semibold text-lg mb-3 line-clamp-2">{gig.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-3 mb-6">{gig.description}</p>
                <div className="flex justify-between items-end">
                  <p className="text-2xl font-bold text-green-600">${gig.price}</p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/gigs">Ver en Marketplace</a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Sales & Reviews */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Mis Ventas y Calificaciones Recibidas ({mySales.length})</h2>
        {mySales.length === 0 ? (
          <div className="text-center py-16 border rounded-3xl text-gray-500">
            Aún no tienes ventas completadas con calificación.
          </div>
        ) : (
          <div className="space-y-6">
            {mySales.map((sale) => (
              <div key={sale.id} className="bg-white border rounded-3xl p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{sale.gigTitle}</h3>
                    <p className="text-sm text-gray-500">Comprador: {sale.buyer}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-2xl">
                      {renderStars(sale.rating || 0)}
                    </div>
                    <p className="text-sm text-green-600 mt-1">${sale.price}</p>
                  </div>
                </div>
                {sale.reviewComment && (
                  <div className="mt-6 pt-6 border-t italic text-gray-700">
                    "{sale.reviewComment}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
