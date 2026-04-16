"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Star, User } from "lucide-react"
import { useEffect, useState } from "react"

export default function HomePage() {
  const [featuredGigs, setFeaturedGigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedGigs()
  }, [])

  const fetchFeaturedGigs = async () => {
    try {
      // Fetch without limit first to get more data
      const res = await fetch("/api/gigs")
      if (res.ok) {
        const data = await res.json()
        // Take only 6 for featured
        setFeaturedGigs(data.gigs?.slice(0, 6) || [])
      }
    } catch (err) {
      console.error("Failed to fetch featured gigs", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-700 via-teal-600 to-cyan-600 text-white py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-2 rounded-full mb-6 text-sm font-medium">
            <MapPin size={18} /> Bucaramanga • Bogotá • Medellín • Cali y todo Colombia
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6 leading-none">
            ¡Oiga usted!<br />
            <span className="text-emerald-200">Encuentra o ofrece servicios locales</span>
          </h1>

          <p className="text-2xl max-w-2xl mx-auto mb-12 text-emerald-100">
            La plataforma colombiana de gigs. Rápido, confiable y 100% local.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-xl px-12 py-8 rounded-3xl bg-white text-emerald-700 hover:bg-emerald-50 font-semibold">
              <Link href="/gigs">Explorar todos los gigs</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-xl px-12 py-8 rounded-3xl border-2 border-white text-white hover:bg-white/10">
              <Link href="/seller">Quiero vender mis servicios</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Featured Gigs - Robust Image Display */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-4xl font-bold text-gray-900">Gigs Destacados</h2>
            <p className="text-gray-600 mt-2">Lo más popular esta semana</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/gigs">Ver todos los gigs →</Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredGigs.map((gig) => (
              <Link key={gig.id} href={`/gigs/${gig.id}`}>
                <Card className="group hover:shadow-2xl transition-all duration-300 overflow-hidden h-full">
                  <div className="relative h-52 bg-gray-100">
                    {gig.imageUrl ? (
                      <Image 
                        src={gig.imageUrl} 
                        alt={gig.title}
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform"
                        sizes="(max-width: 768px) 100vw, 50vw, 33vw"
                        priority={false}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-7xl bg-gradient-to-br from-orange-100 to-amber-100">
                        🛠️
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6 flex flex-col flex-1">
                    <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-emerald-600 transition">
                      {gig.title}
                    </h3>
                    <p className="text-emerald-600 font-bold text-2xl mb-4">
                      ${gig.price?.toLocaleString("es-CO")}
                    </p>
                    <div className="text-sm text-gray-500 mb-4">
                      Por {gig.seller?.name || gig.seller?.businessName || "Vendedor"}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3 flex-1">
                      {gig.description || "Sin descripción disponible"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Categories and CTA unchanged for now */}
      <div className="max-w-7xl mx-auto px-6 py-16 bg-white">
        <h2 className="text-4xl font-bold text-center mb-12">Categorías Populares</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {["Limpieza de Hogar y Oficinas", "Música y DJ para Eventos", "Asesoría Legal y Tributaria", "Diseño Gráfico y Logos", "Cocina Casera y Catering", "Fotografía y Video", "Transporte y Mudanzas", "Belleza y Maquillaje a Domicilio"].map((cat, i) => (
            <Link key={i} href={`/gigs?category=${encodeURIComponent(cat)}`}>
              <Card className="hover:shadow-xl transition">
                <CardContent className="p-10 text-center">
                  <div className="text-6xl mb-6">🛠️</div>
                  <h3 className="font-semibold">{cat}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
