import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, Users, CreditCard, Star, MapPin, Palette, Music } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 text-white py-24">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-5 py-2 rounded-full mb-6">
            🇨🇴 Hecho en Colombia • Para Colombia
          </div>
          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6">
            ¡Oiga Usted!
          </h1>
          <p className="text-2xl md:text-3xl max-w-3xl mx-auto mb-10">
            La plataforma de gigs y servicios locales más confiable de Colombia. 
            Encuentra talento o vende tus habilidades fácil y rápido.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 text-lg px-10 py-7">
              <Link href="/gigs">Explorar Gigs</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-10 py-7">
              <Link href="/create-gig">Publicar mi Gig</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Categorías Populares</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Diseño Gráfico", icon: Palette },
              { name: "Desarrollo Web", icon: Users },
              { name: "Marketing Digital", icon: Star },
              { name: "Fotografía", icon: MapPin },
              { name: "Producción Musical", icon: Music },
              { name: "Turismo", icon: MapPin },
              { name: "Asistente Virtual", icon: Users },
              { name: "Otros Servicios", icon: Star },
            ].map((cat, i) => (
              <div key={i} className="border rounded-2xl p-8 text-center hover:border-yellow-500 hover:shadow transition-all group">
                <cat.icon className="w-12 h-12 mx-auto mb-4 text-yellow-600 group-hover:scale-110 transition" />
                <h3 className="font-semibold">{cat.name}</h3>
              </div>
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
