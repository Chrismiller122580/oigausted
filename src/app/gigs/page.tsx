"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Clock } from "lucide-react"

const categories = [
  "Todas",
  "Limpieza de Hogar y Oficinas",
  "Música y DJ para Eventos",
  "Asesoría Legal y Tributaria",
  "Diseño Gráfico y Logos",
  "Cocina Casera y Catering",
  "Fotografía y Video",
  "Transporte y Mudanzas",
  "Belleza y Maquillaje a Domicilio",
  "Clases Particulares",
  "Artesanías y Productos Hechos a Mano",
  "Cuidado Holístico y Bienestar",
  "Marketing Digital y Redes Sociales",
  "Desarrollo Web y Tiendas Online",
  "Edición de Video y Contenido Audiovisual",
  "Asistente Virtual y Soporte Administrativo",
  "Redacción de Contenidos y Copywriting",
  "Reparaciones y Mantenimiento del Hogar",
  "Clases de Idiomas y Tutorías Online",
  "Diseño de Interiores y Arquitectura",
  "Gestión de Eventos y Organización de Fiestas"
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
        // Handle both direct array and {gigs: []} formats
        const gigList = Array.isArray(data) ? data : (data.gigs || data)
        setGigs(gigList)
        setFilteredGigs(gigList)
      }
    } catch (err) {
      console.error("Failed to fetch gigs", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let result = [...gigs]
    if (selectedCategory !== "Todas") {
      result = result.filter(gig => gig.category === selectedCategory)
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(gig =>
        gig.title?.toLowerCase().includes(term) ||
        gig.description?.toLowerCase().includes(term) ||
        gig.seller?.name?.toLowerCase().includes(term) ||
        gig.seller?.businessName?.toLowerCase().includes(term)
      )
    }
    setFilteredGigs(result)
  }, [searchTerm, selectedCategory, gigs])

  if (loading) {
    return <div className="min-h-screen bg-gray-50 py-12 text-center text-xl">Cargando gigs...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-5xl font-bold tracking-tight">Explorar Gigs</h1>
            <p className="text-xl text-gray-600 mt-2">Encuentra el servicio perfecto en Colombia</p>
          </div>
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

        <div className="flex flex-wrap gap-3 mb-10">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat)}
              className="rounded-full px-6 py-2 whitespace-nowrap"
            >
              {cat}
            </Button>
          ))}
        </div>

        {filteredGigs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-500">No se encontraron gigs</p>
            <Button onClick={() => { setSearchTerm(""); setSelectedCategory("Todas") }} className="mt-6">
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGigs.map((gig) => (
              <Link key={gig.id} href={`/gigs/${gig.id}`}>
                <Card className="group hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col">
                  <div className="relative h-52 bg-gray-100">
                    {gig.imageUrl ? (
                      <img
                        src={gig.imageUrl}
                        alt={gig.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-7xl">
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
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <span>{gig.seller?.name || gig.seller?.businessName || "Vendedor"}</span>
                    </div>
                    {gig.completionTime && (
                      <div className="flex items-center gap-1.5 text-sm text-emerald-600 mb-4">
                        <Clock size={16} />
                        <span>Entrega en {gig.completionTime}</span>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-3 flex-1">
                      {gig.description || "Sin descripción"}
                    </p>
                    {gig.category && (
                      <div className="mt-4 text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1 rounded-full inline-block">
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
