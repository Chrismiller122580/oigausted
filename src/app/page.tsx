"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Search, Wrench, Music, Scale, Camera, Truck, PartyPopper, Scissors, BookOpen, Hammer, Heart } from "lucide-react"
import { useSession } from "next-auth/react"

export default function HomePage() {
  const { data: session } = useSession()

  const categories = [
    { name: "Limpieza de Hogar y Oficinas", icon: Wrench },
    { name: "Música y DJ para Eventos", icon: Music },
    { name: "Asesoría Legal y Tributaria", icon: Scale },
    { name: "Diseño Gráfico y Logos", icon: Hammer },
    { name: "Cocina Casera y Catering", icon: PartyPopper },
    { name: "Fotografía y Video", icon: Camera },
    { name: "Transporte y Mudanzas", icon: Truck },
    { name: "Organización de Eventos y Fiestas", icon: PartyPopper },
    { name: "Belleza y Maquillaje a Domicilio", icon: Scissors },
    { name: "Clases Particulares", icon: BookOpen },
    { name: "Artesanías y Productos Hechos a Mano", icon: Hammer },
    { name: "Cuidado Holístico y Bienestar", icon: Heart }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Matching your current orange style */}
      <div className="bg-gradient-to-br from-orange-600 to-amber-600 text-white py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 px-6 py-2 rounded-full mb-6 text-sm">
            <MapPin size={18} /> Bucaramanga • Bogotá • Medellín • Cali y todo Colombia
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            ¡Oiga usted!<br />
            <span className="text-amber-200">La plataforma colombiana de gigs</span>
          </h1>

          <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-10 text-orange-100">
            Rápido, confiable y 100% local.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="text-lg px-10 py-7 rounded-full bg-white text-orange-600 hover:bg-amber-100 font-semibold">
              <Link href="/gigs">Explorar todos los gigs</Link>
            </Button>

            <Button asChild size="lg" variant="outline" className="text-lg px-10 py-7 rounded-full border-white text-white hover:bg-white/10">
              <Link href="/seller">Quiero vender mis servicios</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">Categorías Populares</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => {
            const Icon = cat.icon
            return (
              <Link key={i} href={`/gigs?category=${encodeURIComponent(cat.name)}`}>
                <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full border-0 shadow-sm">
                  <CardContent className="p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-200 transition-colors">
                      <Icon size={32} className="text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-lg leading-tight group-hover:text-orange-600 transition">
                      {cat.name}
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-white py-20 border-t">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">¿Listo para empezar?</h2>
          <p className="text-xl text-gray-600 mb-10">Miles de colombianos ya conectan servicios locales todos los días.</p>
          <Button asChild size="lg" className="text-xl px-12 py-8 rounded-full bg-orange-600 hover:bg-orange-700">
            <Link href="/gigs">Ver Todos los Gigs Ahora</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
