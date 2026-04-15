"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import { useSession } from "next-auth/react"

export default function HomePage() {
  const { data: session } = useSession()

  const categories = [
    { name: "Limpieza de Hogar y Oficinas", icon: "🧹" },
    { name: "Música y DJ para Eventos", icon: "🎸" },
    { name: "Asesoría Legal y Tributaria", icon: "⚖️" },
    { name: "Diseño Gráfico y Logos", icon: "🎨" },
    { name: "Cocina Casera y Catering", icon: "🍲" },
    { name: "Fotografía y Video", icon: "📸" },
    { name: "Transporte y Mudanzas", icon: "🚚" },
    { name: "Organización de Eventos y Fiestas", icon: "🎉" },
    { name: "Belleza y Maquillaje a Domicilio", icon: "💄" },
    { name: "Clases Particulares", icon: "📚" },
    { name: "Artesanías y Productos Hechos a Mano", icon: "🪚" },
    { name: "Cuidado Holístico y Bienestar", icon: "🌿" }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero - New Fresh Green Theme */}
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
            <Button 
              asChild 
              size="lg" 
              className="text-xl px-12 py-8 rounded-3xl bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-xl"
            >
              <Link href="/gigs">Explorar todos los gigs</Link>
            </Button>

            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="text-xl px-12 py-8 rounded-3xl border-2 border-white text-white hover:bg-white/10 font-semibold"
            >
              <Link href="/seller">Quiero vender mis servicios</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Categories - Updated with better colors */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Categorías Populares</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <Link key={i} href={`/gigs?category=${encodeURIComponent(cat.name)}`}>
              <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full border border-gray-100 hover:border-emerald-200">
                <CardContent className="p-10 flex flex-col items-center text-center">
                  <div className="text-6xl mb-6 transition-transform group-hover:scale-110">
                    {cat.icon}
                  </div>
                  <h3 className="font-semibold text-xl leading-tight text-gray-800 group-hover:text-emerald-700 transition-colors">
                    {cat.name}
                  </h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-white py-20 border-t">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4 text-gray-900">¿Listo para empezar?</h2>
          <p className="text-xl text-gray-600 mb-10">Miles de colombianos ya conectan servicios locales todos los días.</p>
          <Button asChild size="lg" className="text-xl px-14 py-8 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white">
            <Link href="/gigs">Ver Todos los Gigs Ahora</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
