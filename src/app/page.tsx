import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Search, 
  Users, 
  CreditCard, 
  Star, 
  Coffee, 
  MapPin, 
  Music, 
  Palette 
} from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col">
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
              <Button size="lg" className="bg-white text-black hover:bg-white/90 text-lg px-10 py-7 rounded-full font-semibold flex items-center gap-3" asChild>
                <Link href="/gigs">
                  <Search className="w-5 h-5" />
                  Explorar Gigs Ahora
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-10 py-7 rounded-full font-semibold" asChild>
                <Link href="/create-gig">Publicar tu Gig Gratis</Link>
              </Button>
            </div>

            <p className="text-white/70 mt-8 text-sm">
              +2,500 gigs • Pagos seguros con Wompi • Soporte local
            </p>
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <div className="bg-white py-6 border-b">
        <div className="container flex flex-wrap justify-center gap-x-12 gap-y-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Pagos seguros en COP</div>
          <div className="flex items-center gap-2"><Users className="w-4 h-4" /> Soporte en español</div>
          <div className="flex items-center gap-2"><Star className="w-4 h-4" /> Talento local verificado</div>
          <div className="flex items-center gap-2"><Coffee className="w-4 h-4" /> Economía Naranja impulsada</div>
        </div>
      </div>

      {/* Categories with Icons */}
      <section className="py-16 bg-gray-50">
        <div className="container px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Encuentra lo que necesitas
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              { name: "Diseño Gráfico", icon: Palette },
              { name: "Desarrollo Web", icon: Users },
              { name: "Marketing Digital", icon: Star },
              { name: "Asistente Virtual", icon: Users },
              { name: "Turismo & Experiencias", icon: MapPin },
              { name: "Producción Musical", icon: Music },
              { name: "Traducción", icon: Users },
              { name: "Fotografía", icon: Palette },
              { name: "Redes Sociales", icon: Star },
              { name: "Consultoría Agro", icon: Coffee },
              { name: "Legal & Tributario", icon: Users },
              { name: "Otros Servicios", icon: Star },
            ].map((cat, index) => (
              <div
                key={index}
                className="group bg-white border rounded-2xl p-8 text-center hover:border-yellow-500 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col items-center"
              >
                <cat.icon className="w-12 h-12 text-yellow-600 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-lg">{cat.name}</h3>
              </div>
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