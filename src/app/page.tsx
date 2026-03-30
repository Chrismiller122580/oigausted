import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Palette, Users, Star, MapPin, Music, Coffee } from "lucide-react"

const categories = [
  { name: "Diseño Gráfico", icon: Palette, slug: "Diseño Gráfico" },
  { name: "Desarrollo Web", icon: Users, slug: "Desarrollo Web" },
  { name: "Marketing Digital", icon: Star, slug: "Marketing Digital" },
  { name: "Fotografía", icon: MapPin, slug: "Fotografía" },
  { name: "Producción Musical", icon: Music, slug: "Producción Musical" },
  { name: "Turismo", icon: MapPin, slug: "Turismo" },
  { name: "Asistente Virtual", icon: Users, slug: "Asistente Virtual" },
  { name: "Otros Servicios", icon: Coffee, slug: "Otros Servicios" },
]

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 text-white py-24 md:py-32 relative overflow-hidden">
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-5 py-2 rounded-full mb-6 text-sm font-medium">
            🇨🇴 Hecho en Colombia • Para Colombia
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter leading-tight mb-6">
            ¡Oiga Usted!
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mb-10">
            La plataforma de gigs y servicios locales más confiable de Colombia. 
            Encuentra talento o vende tus habilidades en un clic.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 text-lg px-10 py-7">
              <Link href="/gigs">Explorar Gigs Ahora</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-10 py-7">
              <Link href="/create-gig">Publicar mi Gig</Link>
            </Button>
          </div>
        </div>

        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Explora por Categoría</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <Link 
                key={i} 
                href={`/gigs?category=${encodeURIComponent(cat.slug)}`}
                className="group border rounded-2xl p-8 text-center hover:border-yellow-500 hover:shadow-xl transition-all duration-300 flex flex-col items-center"
              >
                <cat.icon className="w-12 h-12 mx-auto mb-4 text-yellow-600 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-lg group-hover:text-yellow-600 transition-colors">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-yellow-600 py-16 text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold mb-4">¿Tienes habilidades para ofrecer?</h2>
          <p className="text-xl mb-8 max-w-xl mx-auto">Únete a miles de colombianos que ya ganan dinero con sus talentos locales</p>
          <Button asChild size="lg" className="bg-white text-yellow-600 hover:bg-white/90 text-lg px-12 py-7">
            <Link href="/create-gig">Publicar mi primer Gig Gratis</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
