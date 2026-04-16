"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Star, Search, MapPin } from "lucide-react"

const categories = [
  "Todas", "Limpieza de Hogar y Oficinas", "Música y DJ para Eventos", 
  "Asesoría Legal y Tributaria", "Diseño Gráfico y Logos", "Cocina Casera y Catering",
  "Fotografía y Video", "Transporte y Mudanzas", "Belleza y Maquillaje a Domicilio"
]

export default function GigsPage() {
  const [gigs, setGigs] = useState<any[]>([])
  const [filteredGigs, setFilteredGigs] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todas")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGigs()
  }, [])

  const fetchGigs = async () => {
    try {
      const res = await fetch("/api/gigs")
      if (res.ok) {
        const data = await res.json()
        setGigs(data.gigs || [])
        setFilteredGigs(data.gigs || [])
      }
    } catch (err) {
      console.error("Failed to fetch gigs", err)
    } finally {
      setLoading(false)
    }
  }

  // Filter gigs when search or category changes
  useEffect(() => {
    let result = [...gigs]

    // Category filter
    if (selectedCategory !== "Todas") {
      result = result.filter(gig => gig.category === selectedCategory)
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(gig => 
        gig.title.toLowerCase().includes(term) || 
        (gig.description && gig.description.toLowerCase().includes(term)) ||
        (gig.seller?.name && gig.seller.name.toLowerCase().includes(term))
      )
    }

    setFilteredGigs(result)
  }, [searchTerm, selectedCategory, gigs])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center py-20">Cargando gigs...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-5xl font-bold tracking-tight">Explorar Gigs</h1>
            <p className="text-xl text-gray-600 mt-2">Encuentra el servicio perfecto en Colombia</p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Busca por título, descripción o vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-6 text-base rounded-3xl border-gray-200 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 mb-10">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat)}
              className="rounded-full px-6 py-2"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Gigs Grid */}
        {filteredGigs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-500">No se encontraron gigs con esos filtros</p>
            <Button onClick={() => { setSearchTerm(""); setSelectedCategory("Todas") }} className="mt-6">
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGigs.map((gig) => (
              <Link key={gig.id} href={`/gigs/${gig.id}`}>
                <Card className="group hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col">
                  <div className="relative h-52 bg-gray-200">
                    {gig.imageUrl ? (
                      <Image 
                        src={gig.imageUrl} 
                        alt={gig.title}
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-6xl">
                        🛠️
                      </div>
                    )}
                  </div>

                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-emerald-600 transition">
                        {gig.title}
                      </h3>
                      <p className="font-bold text-emerald-600 text-xl whitespace-nowrap ml-4">
                        ${gig.price?.toLocaleString("es-CO")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <span>{gig.seller?.name || gig.seller?.businessName || "Vendedor"}</span>
                      {gig.seller?.rating && (
                        <span className="flex items-center gap-1 ml-auto">
                          <Star className="fill-yellow-400 text-yellow-400" size={16} />
                          {gig.seller.rating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-3 flex-1">
                      {gig.description}
                    </p>

                    {gig.category && (
                      <div className="mt-4 text-xs text-emerald-600 font-medium">
                        {gig.category}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
