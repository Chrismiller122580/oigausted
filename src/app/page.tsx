import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h1 className="text-6xl font-bold mb-6">
            ¡Oiga usted!
          </h1>
          <p className="text-2xl mb-10">
            Encuentra talento local o publica tus servicios en Colombia
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
              <Link href="/gigs">Ver Gigs</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Link href="/create-gig">Publicar Gig</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-16 text-center">
        <p className="text-xl text-gray-600">
          Plataforma simple y funcional para gigs en Colombia
        </p>
      </div>
    </div>
  )
}
