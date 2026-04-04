import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFCD00]/10 via-white to-[#003087]/5">
      <div className="container max-w-5xl mx-auto px-6 pt-24 pb-32 text-center">
        {/* Hero Logo */}
        <div className="flex justify-center mb-10">
          <div className="w-64 h-auto">
            <img 
              src="/logo.png" 
              alt="OigaUsted" 
              className="w-full h-full drop-shadow-xl"
            />
          </div>
        </div>

        <h1 className="text-6xl md:text-7xl font-bold leading-tight mb-8 text-[#003087]">
          La plataforma de gigs<br />
          <span className="text-[#FFCD00]">más confiable de Colombia</span>
        </h1>

        <p className="text-2xl text-gray-700 max-w-2xl mx-auto mb-12">
          Conecta compradores y vendedores locales • Pagos seguros con Wompi • Entregas rápidas y confiables
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Button asChild size="lg" className="text-lg py-8 px-14 bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-[#003087] font-semibold shadow-lg">
            <Link href="/gigs">Explorar Gigs</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg py-8 px-14 border-2 border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white">
            <Link href="/seller">Soy Vendedor</Link>
          </Button>
        </div>

        <div className="mt-20 flex justify-center gap-8 text-sm text-gray-500">
          <div>Gigs Colombia</div>
          <div>•</div>
          <div>Hecho en Colombia</div>
          <div>•</div>
          <div>Para Colombia 🇨🇴</div>
        </div>
      </div>
    </div>
  )
}
