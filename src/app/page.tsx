import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 text-white py-24">
        <div className="max-w-4xl mx-auto text-center px-6">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full mb-6 text-sm font-medium">
            🇨🇴 Hecho en Colombia • Para Colombia
          </div>

          <h1 className="text-6xl font-bold mb-6 tracking-tighter">
            ¡Oiga usted!
          </h1>
          <p className="text-2xl mb-10 max-w-2xl mx-auto">
            La plataforma de gigs y servicios locales más confiable de Colombia.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 text-lg px-10 py-7">
              <Link href="/gigs">Explorar Gigs</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-10 py-7">
              <Link href="/create-gig">Publicar tu Gig Gratis</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-xl text-gray-600">
          Encuentra talento local o vende tus habilidades fácilmente
        </p>
      </div>
    </div>
  )
}
