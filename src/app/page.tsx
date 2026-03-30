"use client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Search, Users, CreditCard, Star, Coffee, MapPin, Music, Palette } from "lucide-react"

const categories = [
  { name: "Diseño Gráfico", icon: Palette, slug: "diseño" },
  { name: "Fotografía", icon: MapPin, slug: "fotografia" },
  { name: "Redes Sociales", icon: Star, slug: "redes" },
  { name: "Consultoría Agro", icon: Coffee, slug: "agro" },
  { name: "Legal & Tributario", icon: Users, slug: "legal" },
  { name: "Desarrollo Web", icon: Music, slug: "web" },
]

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full py-24 md:py-32 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px]"></div>
        
        <div className="container px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full mb-6 text-sm font-medium">
              🇨🇴 Hecho en Colombia • Para Colombia
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight mb-6">
              ¡Oiga usted!
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mb-10">
              La plataforma de gigs y servicios locales más confiable de Colombia. 
              Encuentra talento o vende tus habilidades en un clic.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-black hover:bg-white/90 text-lg px-10 py-7 rounded-full" asChild>
                <Link href="/gigs">Explorar Gigs Ahora</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-10 py-7 rounded-full" asChild>
                <Link href="/create-gig">Publicar mi Gig Gratis</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Encuentra lo que necesitas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((cat, index) => (
              <Link 
                key={index} 
                href={`/gigs?category=${cat.slug}`}
                className="group bg-white border rounded-3xl p-8 text-center hover:border-yellow-500 hover:shadow-xl transition-all duration-300 flex flex-col items-center"
              >
                <cat.icon className="w-12 h-12 text-yellow-600 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-lg">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-yellow-600 py-16 text-white">
        <div className="container px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">¿Tienes habilidades para ofrecer?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-xl mx-auto">
            Únete a miles de colombianos que ya ganan dinero con sus talentos
          </p>
          <Button size="lg" variant="secondary" className="bg-white text-yellow-600 hover:bg-white/90 text-lg px-12 py-7 rounded-full" asChild>
            <Link href="/create-gig">Publicar mi primer Gig Gratis</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
