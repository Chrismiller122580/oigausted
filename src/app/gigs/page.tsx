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
      // Production-safe fetch (works on Vercel and local)
      const baseUrl = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const res = await fetch(`${baseUrl}/api/gigs`, {
        cache: 'no-store',
        next: { revalidate: 0 }
      })

      if (!res.ok) {
        console.error('Failed to fetch gigs:', res.status)
        setGigs([])
        return
      }

      const data = await res.json()
      // Handle both direct array and wrapped responses
      const gigList = Array.isArray(data) ? data : (data.gigs || data || [])
      setGigs(gigList)
      setFilteredGigs(gigList)
    } catch (error) {
      console.error('Error fetching gigs:', error)
      setGigs([])
    } finally {
      setLoading(false)
    }
  }

  // Filter logic
  useEffect(() => {
    let result = [...gigs]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(gig => 
        gig.title?.toLowerCase().includes(term) || 
        gig.description?.toLowerCase().includes(term)
      )
    }

    if (selectedCategory !== "Todas") {
      result = result.filter(gig => gig.category === selectedCategory)
    }

    setFilteredGigs(result)
  }, [gigs, searchTerm, selectedCategory])

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando gigs...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10">
        <h1 className="text-4xl font-bold mb-4 md:mb-0">Todos los Servicios</h1>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Input
              type="text"
              placeholder="Buscar servicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          </div>

          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded-2xl px-4 py-2"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGigs.length > 0 ? (
          filteredGigs.map((gig) => (
            <Card key={gig.id} className="overflow-hidden hover:shadow-xl transition">
              <div className="relative h-48 bg-gray-100">
                {gig.imageUrl ? (
                  <img 
                    src={gig.imageUrl} 
                    alt={gig.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Sin+Imagen'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                    Sin imagen
                  </div>
                )}
              </div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg line-clamp-2">{gig.title}</h3>
                  <span className="text-xl font-bold text-orange-600">
                    ${Number(gig.price).toLocaleString('es-CO')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{gig.description}</p>
                
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Clock className="h-4 w-4" />
                  <span>{gig.completionTime || 'N/A'} días</span>
                </div>

                <Link href={`/gigs/${gig.id}`}>
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    Ver Detalles
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="col-span-full text-center py-12 text-gray-500">No se encontraron gigs</p>
        )}
      </div>
    </div>
  )
}
