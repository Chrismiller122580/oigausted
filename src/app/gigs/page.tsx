"use client"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
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

export default function GigsPage() {
  const searchParams = useSearchParams()
  const categoryFilter = searchParams.get("category")
  const [gigs, setGigs] = useState<Gig[]>([])
  const [searchTerm, setSearchTerm] = useState("")

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
                  <Button asChild size="sm">
                    <Link href={`/orders/new?gigId=${gig.id}`}>Comprar Ahora</Link>
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
    </div>
  )
}
