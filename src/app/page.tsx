"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, User, Bell, Menu, MapPin } from "lucide-react"
import { useSession, signIn, signOut } from "next-auth/react"

export default function HomePage() {
  const { data: session } = useSession()

  const categories = [
    "Limpieza de Hogar y Oficinas", "Música y DJ para Eventos", "Asesoría Legal y Tributaria",
    "Diseño Gráfico y Logos", "Cocina Casera y Catering", "Fotografía y Video",
    "Transporte y Mudanzas", "Organización de Eventos y Fiestas", "Belleza y Maquillaje a Domicilio",
    "Clases Particulares", "Artesanías y Productos Hechos a Mano", "Cuidado Holístico y Bienestar"
  ]

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 bg-white border-b z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">O</div>
              <div>
                <div className="font-bold text-2xl tracking-tight">OigaUsted</div>
                <div className="text-[10px] text-gray-500 -mt-1">Gigs Colombia</div>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/gigs" className="hover:text-orange-600 transition">Explorar Gigs</Link>
              <Link href="/seller" className="hover:text-orange-600 transition">Vender</Link>
              <Link href="/how-it-works" className="hover:text-orange-600 transition">Cómo Funciona</Link>
            </div>
          </div>

          <div className="flex-1 max-w-xl mx-8 relative hidden md:block">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <Input 
                type="text" 
                placeholder="¿Qué servicio necesitas hoy? (ej: logo, limpieza, DJ...)"
                className="pl-12 py-6 text-base rounded-3xl border-gray-200 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell size={20} />
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">3</div>
                </Button>
                <Button variant="ghost" size="icon">
                  <User size={20} />
                </Button>
                <Button onClick={() => signOut()} variant="outline" className="hidden md:flex">Cerrar sesión</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => signIn()}>Ingresar</Button>
                <Button asChild className="bg-orange-600 hover:bg-orange-700">
                  <Link href="/register">Registrarse</Link>
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu size={24} />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 text-white py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-2 rounded-full mb-6">
            <MapPin size={18} /> Bucaramanga • Bogotá • Medellín • Cali y todo Colombia
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6">
            ¡Oiga usted!<br />
            <span className="text-amber-200">Encuentra o ofrece servicios locales</span>
          </h1>
          
          <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-10 text-orange-100">
            La plataforma colombiana de gigs. Rápido, confiable y 100% local.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-10 py-8 rounded-3xl bg-white text-orange-600 hover:bg-white/90 font-semibold">
              <Link href="/gigs">Explorar todos los gigs</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-10 py-8 rounded-3xl border-white text-white hover:bg-white/10">
              <Link href="/seller">Quiero vender mis servicios</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">Categorías Populares</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <Link key={i} href={`/gigs?category=${encodeURIComponent(cat)}`}>
              <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full group">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl mb-4">🛠️</div>
                  <h3 className="font-semibold text-lg group-hover:text-orange-600 transition">{cat}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA Footer-like section */}
      <div className="bg-white py-20 border-t">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">¿Listo para empezar?</h2>
          <p className="text-xl text-gray-600 mb-10">Miles de colombianos ya conectan servicios locales todos los días.</p>
          <Button asChild size="lg" className="text-xl px-12 py-8 rounded-3xl">
            <Link href="/gigs">Ver Todos los Gigs Ahora</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
