import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-6">
        <h1 className="text-7xl font-bold text-yellow-600 mb-6">OigaUsted</h1>
        <p className="text-2xl text-gray-700 mb-12">
          La plataforma de servicios freelance más confiable de Colombia
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Button asChild size="lg" className="text-lg py-8 px-12 bg-yellow-600 hover:bg-yellow-700">
            <Link href="/gigs">Explorar Gigs</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg py-8 px-12">
            <Link href="/seller">Soy Vendedor</Link>
          </Button>
        </div>

        <p className="text-sm text-gray-500 mt-16">
          Conecta compradores y vendedores locales • Pagos seguros • Entregas rápidas
        </p>
      </div>
    </div>
  )
}
