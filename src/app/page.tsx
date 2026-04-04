"use client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Palette, MapPin, Star, Coffee, Music, Camera, Utensils, Truck, Briefcase, Home as CleaningIcon } from "lucide-react"

export default function Home() {
  const { data: session } = useSession()
  
  // Safe role extraction
  const role = (session?.user as any)?.role || "visitor"

  const welcomeMessage = role === "buyer" 
    ? "¡Bienvenido de nuevo, Comprador! ¿Qué servicio necesitas hoy?"
    : role === "seller" 
    ? "¡Bienvenido de nuevo, Vendedor! ¿Listo para publicar o gestionar tus gigs?"
    : role === "admin" 
    ? "👋 Bienvenido al Panel de Administración"
    : "¡Oiga usted! La plataforma de gigs local de Colombia"

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero with logo and welcome */}
      <section className="relative py-20 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <img src="/logo.png" alt="OigaUsted" className="mx-auto mb-8 w-64 drop-shadow-2xl" />
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">¡Oiga usted!</h1>
          <p className="text-2xl max-w-2xl mx-auto mb-10">{welcomeMessage}</p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            {role === "buyer" && (
              <Button size="lg" asChild>
                <Link href="/gigs">Explorar Gigs</Link>
              </Button>
            )}
            {role === "seller" && (
              <Button size="lg" asChild>
                <Link href="/seller">Ir a Mi Dashboard</Link>
              </Button>
            )}
            <Button size="lg" variant="secondary" asChild>
              <Link href="/gigs">Ver Todos los Gigs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-10">Categorías Populares</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Diseño Gráfico", icon: Palette },
              { name: "Limpieza", icon: CleaningIcon },
              { name: "Cocina", icon: Utensils },
              { name: "Música y Eventos", icon: Music },
              { name: "Fotografía", icon: Camera },
              { name: "Asesoría Legal", icon: Briefcase },
              { name: "Transporte", icon: Truck },
              { name: "Otros Servicios", icon: Star },
            ].map((cat, index) => (
              <div key={index} className="group bg-white border rounded-2xl p-8 text-center hover:border-yellow-500 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col items-center">
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
