"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingBag, Package, MessageCircle } from "lucide-react"

export default function BuyerDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-bold tracking-tight">Hola, Comprador</h1>
            <p className="text-xl text-gray-600 mt-3">¿Qué servicio necesitas hoy?</p>
          </div>
        </div>

        {/* Big Buy Button */}
        <Card className="mb-12 bg-gradient-to-r from-orange-600 to-orange-700 text-white">
          <CardContent className="p-12 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">Encuentra y Compra Servicios</h2>
            <p className="text-xl mb-8 max-w-md mx-auto">
              Miles de gigs disponibles. Encuentra el freelancer perfecto para tu proyecto.
            </p>
            <Button asChild size="lg" className="bg-white text-orange-700 hover:bg-gray-100 text-xl px-12 py-7 rounded-2xl font-semibold">
              <Link href="/gigs">
                Explorar Gigs y Comprar Ahora
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-orange-100 p-4 rounded-2xl">
                  <ShoppingBag className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-2xl">Explorar Gigs</h3>
                  <p className="text-gray-600">Descubre servicios</p>
                </div>
              </div>
              <Button asChild className="w-full">
                <Link href="/gigs">Ver Todos los Gigs</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-blue-100 p-4 rounded-2xl">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-2xl">Mis Pedidos</h3>
                  <p className="text-gray-600">Gestiona tus compras</p>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/orders">Ver Mis Órdenes</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-green-100 p-4 rounded-2xl">
                  <MessageCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-2xl">Chats Activos</h3>
                  <p className="text-gray-600">Habla con vendedores</p>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/orders">Ir a Chats</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
