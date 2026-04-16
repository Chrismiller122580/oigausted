"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Star, User } from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

export default function HomePage() {
  const { data: session } = useSession()
  const [featuredGigs, setFeaturedGigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedGigs()
  }, [])

  const fetchFeaturedGigs = async () => {
    try {
      const res = await fetch("/api/gigs?limit=6")
      if (res.ok) {
        const data = await res.json()
        setFeaturedGigs(data.gigs || [])
      }
    } catch (err) {
      console.error("Failed to fetch featured gigs", err)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { name: "Limpieza de Hogar y Oficinas", icon: "🧹" },
    { name: "Música y DJ para Eventos", icon: "🎸" },
    { name: "Asesoría Legal y Tributaria", icon: "⚖️" },
    { name: "Diseño Gráfico y Logos", icon: "🎨" },
    { name: "Cocina Casera y Catering", icon: "🍲" },
    { name: "Fotografía y Video", icon: "📸" },
    { name: "Transporte y Mudanzas", icon: "🚚" },
    { name: "Belleza y Maquillaje a Domicilio", icon: "💄" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - unchanged */}
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

      {/* Featured Gigs - Improved Image Handling */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-4xl font-bold text-gray-900">Gigs Destacados</h2>
            <p className="text-gray-600 mt-2">Lo más popular en OigaUsted esta semana</p>
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
                  <div className="relative h-48 bg-gray-100">
                    {gig.imageUrl ? (
                      <Image 
                        src={gig.imageUrl} 
                        alt={gig.title}
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-6xl">
                        🛠️
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-emerald-600 transition">
                        {gig.title}
                      </h3>
                      <p className="font-bold text-emerald-600 text-xl">
                        ${gig.price?.toLocaleString("es-CO")}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <User size={16} />
                      <span>{gig.seller?.name || gig.seller?.businessName || "Vendedor"}</span>
                      {gig.seller?.rating && (
                        <span className="flex items-center gap-1 ml-auto">
                          <Star className="fill-yellow-400 text-yellow-400" size={16} />
                          {gig.seller.rating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2">
                      {gig.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Rest of your homepage (categories + CTA) remains the same */}
      <div className="max-w-7xl mx-auto px-6 py-16 bg-white">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Categorías Populares</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <Link key={i} href={`/gigs?category=${encodeURIComponent(cat.name)}`}>
              <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                <CardContent className="p-10 flex flex-col items-center text-center">
                  <div className="text-6xl mb-6 transition-transform group-hover:scale-110">
                    {cat.icon}
                  </div>
                  <h3 className="font-semibold text-xl leading-tight group-hover:text-emerald-700 transition">
                    {cat.name}
                  </h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-emerald-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">¿Listo para empezar?</h2>
          <p className="text-xl mb-10 opacity-90">Miles de colombianos ya conectan servicios locales todos los días.</p>
          <Button asChild size="lg" className="text-xl px-14 py-8 rounded-3xl bg-white text-emerald-700 hover:bg-emerald-50">
            <Link href="/gigs">Explorar Todos los Gigs Ahora</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
