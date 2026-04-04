"use client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Palette, MapPin, Star, Coffee, Music, Camera, Utensils, Truck, Briefcase, Home as CleaningIcon } from "lucide-react"

export default function Home() {
  const { data: session } = useSession()
  const role = session?.user?.role || "visitor"

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
          
          <div className="flex gap-4 justify-center">
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

      {/* Rest of homepage (categories + CTA) */}
      {/* ... (your existing content) */}
    </div>
  )
}
