"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-12 px-6 max-w-2xl">
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-yellow-600 text-white rounded-full mx-auto flex items-center justify-center text-4xl mb-4">
          👤
        </div>
        <h1 className="text-4xl font-bold">Mi Perfil</h1>
        <p className="text-gray-600 mt-2">Demo User • Bucaramanga</p>
      </div>

      <div className="grid gap-6">
        <div className="bg-white border rounded-3xl p-8">
          <h3 className="font-semibold text-lg mb-6">Acciones Rápidas</h3>
          <div className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/create-gig">Publicar Nuevo Gig</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/gigs">Ver Mis Gigs Publicados</Link>
            </Button>
          </div>
        </div>

        <div className="bg-white border rounded-3xl p-8">
          <h3 className="font-semibold text-lg mb-4">Mis Compras</h3>
          <p className="text-gray-500">Aún no tienes compras. ¡Explora gigs!</p>
        </div>
      </div>
    </div>
  )
}
