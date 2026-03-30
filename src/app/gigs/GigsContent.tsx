"use client"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
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
  deliveryDays?: number
  rating?: number
  reviewCount?: number
}

export default function GigsContent() {
  const searchParams = useSearchParams()
  const categoryFilter = searchParams.get("category")
  const router = useRouter()
  const { showToast } = useToast()
  const [gigs, setGigs] = useState<Gig[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null)
  const [showBuyModal, setShowBuyModal] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("oigausted-gigs")
    if (saved) setGigs(JSON.parse(saved))
  }, [])

  const filteredGigs = gigs.filter(gig => {
    const matchesSearch = 
      gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = !categoryFilter || 
      gig.category.toLowerCase().includes(categoryFilter.toLowerCase())

    return matchesSearch && matchesCategory
  })

  const buyGig = (gig: Gig) => {
    setSelectedGig(gig)
    setShowBuyModal(true)
  }

  const confirmPurchase = () => {
    if (!selectedGig) return

    const newOrder = {
      id: Date.now().toString(),
      gigTitle: selectedGig.title,
      price: selectedGig.price,
      status: "Pending",
      progress: 0,
      buyer: "Tú (Comprador)",
      seller: selectedGig.seller,
      messages: [],
      paidToSeller: false,
      createdAt: new Date().toISOString()
    }

    const savedOrders = localStorage.getItem("oigausted-orders") || "[]"
    const orders = JSON.parse(savedOrders)
    orders.unshift(newOrder)
    localStorage.setItem("oigausted-orders", JSON.stringify(orders))

    setShowBuyModal(false)
    showToast("¡Compra realizada! Redirigiendo a tu pedido...", "success")

    // Auto-redirect to the new order
    setTimeout(() => {
      router.push(`/orders/${newOrder.id}`)
    }, 800)
  }

  const renderStars = (rating: number = 0) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? "text-yellow-500" : "text-gray-300"}>★</span>
    ))
  }

  return (
    <div className="container mx-auto py-12 px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-bold">Explorar Gigs</h1>
          <p className="text-gray-600 mt-2">
            {categoryFilter ? `Resultados para "${categoryFilter}"` : "Encuentra talento local en Colombia"}
          </p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar gigs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-2xl px-5 py-3 flex-1 md:w-80 focus:outline-none focus:border-yellow-600"
          />
          <Button asChild>
            <Link href="/create-gig">Publicar Gig</Link>
          </Button>
        </div>
      </div>

      {filteredGigs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-2xl text-gray-400">No se encontraron gigs</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGigs.map((gig) => (
            <div key={gig.id} className="bg-white border rounded-3xl overflow-hidden hover:shadow-xl transition-all group">
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold line-clamp-2 group-hover:text-yellow-600 transition-colors">
                    {gig.title}
                  </h3>
                  {gig.rating && (
                    <div className="flex items-center gap-1 text-sm">
                      {renderStars(gig.rating)}
                      <span className="text-gray-500 ml-1">({gig.reviewCount || 1})</span>
                    </div>
                  )}
                </div>

                <p className="text-gray-600 line-clamp-3 mb-6">{gig.description}</p>

                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-3xl font-bold text-green-600">${gig.price}</p>
                    <p className="text-xs text-gray-500">COP</p>
                  </div>
                  <Button size="sm" onClick={() => buyGig(gig)}>
                    Comprar Ahora
                  </Button>
                </div>
              </div>
              <div className="border-t px-8 py-4 text-sm text-gray-500 flex justify-between">
                <span>Por {gig.seller}</span>
                {gig.deliveryDays && <span>Entrega en {gig.deliveryDays} días</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Buy Confirmation Modal */}
      {showBuyModal && selectedGig && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-8 text-center">
              <h2 className="text-2xl font-bold">Confirmar Compra</h2>
              <p className="mt-2 opacity-90">{selectedGig.title}</p>
            </div>
            <div className="p-8">
              <p className="text-lg font-medium mb-6">¿Estás seguro de comprar este gig por <span className="text-green-600">${selectedGig.price}</span>?</p>
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowBuyModal(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={confirmPurchase}>
                  Sí, Comprar Ahora
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
