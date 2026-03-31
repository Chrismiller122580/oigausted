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
    const matchesSearch = searchTerm === "" ||
      gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.description.toLowerCase().includes(searchTerm.toLowerCase())
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
      buyer: "Tú",
      seller: selectedGig.seller,
      messages: [],
      paidToSeller: false,
      createdAt: new Date().toISOString()
    }

    const orders = JSON.parse(localStorage.getItem("oigausted-orders") || "[]")
    orders.unshift(newOrder)
    localStorage.setItem("oigausted-orders", JSON.stringify(orders))

    setShowBuyModal(false)
    showToast(`¡Compra de "${selectedGig.title}" realizada con éxito!`, "success")

    // Auto redirect to order detail
    setTimeout(() => {
      router.push(`/orders/${newOrder.id}`)
    }, 800)
  }

  const renderStars = (rating = 0) => Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < Math.floor(rating) ? "text-yellow-500" : "text-gray-300"}>★</span>
  ))

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 max-w-7xl">
      {/* Search + Publish */}
      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <input
          type="text"
          placeholder="Buscar gigs o servicios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border-2 rounded-3xl px-6 py-4 text-lg focus:outline-none focus:border-yellow-500"
        />
        <Button asChild className="w-full md:w-auto px-8 py-6 text-lg font-medium">
          <Link href="/create-gig">+ Publicar Gig</Link>
        </Button>
      </div>

      {/* Gigs Grid - Better mobile layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredGigs.map((gig) => (
          <div key={gig.id} className="bg-white border rounded-3xl overflow-hidden hover:shadow-2xl transition-all group flex flex-col">
            <div className="p-6 flex-1">
              <h3 className="font-semibold text-xl leading-tight mb-3 group-hover:text-yellow-600 transition-colors line-clamp-2">
                {gig.title}
              </h3>
              <p className="text-gray-600 text-[15px] line-clamp-3 mb-6">{gig.description}</p>

              {gig.rating && (
                <div className="flex items-center gap-1 mb-4 text-sm">
                  {renderStars(gig.rating)}
                  <span className="text-gray-500 ml-1">({gig.reviewCount || 1})</span>
                </div>
              )}
            </div>

            <div className="border-t p-6 mt-auto">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl font-bold text-green-600"> ${gig.price}</span>
                  <span className="text-xs text-gray-500 block">COP</span>
                </div>
                <Button 
                  onClick={() => buyGig(gig)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-8 py-6 text-base rounded-2xl shadow-md active:scale-95 transition-all"
                >
                  Comprar Ahora
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Prominent Buy Confirmation Modal */}
      {showBuyModal && selectedGig && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden">
            <div className="p-8 text-center border-b">
              <h2 className="text-2xl font-bold mb-2">Confirmar Compra</h2>
              <p className="text-lg text-gray-700">{selectedGig.title}</p>
            </div>
            
            <div className="p-8">
              <div className="text-center mb-8">
                <p className="text-5xl font-bold text-green-600 mb-1">${selectedGig.price}</p>
                <p className="text-gray-500">COP</p>
              </div>

              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  className="flex-1 py-7 text-lg font-medium"
                  onClick={() => setShowBuyModal(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 py-7 text-lg font-medium bg-green-600 hover:bg-green-700 active:bg-green-800"
                  onClick={confirmPurchase}
                >
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
