"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingBag, Package, MessageCircle, ArrowRight, Star } from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

export default function BuyerDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState({ orders: 0, inProgress: 0, rating: 0 })

  useEffect(() => {
    if (!session?.user?.id) return
    fetch('/api/orders?role=buyer')
      .then(res => res.json())
      .then(data => {
        const orders = Array.isArray(data) ? data : []
        setStats({
          orders: orders.length,
          inProgress: orders.filter(o => o.status === 'In Progress').length,
          rating: 4.9 // placeholder - we can add real ratings later
        })
      })
      .catch(console.error)
  }, [session])

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-bold tracking-tight">Hola, Comprador 👋</h1>
            <p className="text-xl text-gray-600 mt-3">¿Qué servicio necesitas hoy en Bucaramanga?</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="p-8 flex items-center gap-6">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-3xl">📦</div>
              <div>
                <p className="text-4xl font-bold">{stats.orders}</p>
                <p className="text-gray-600">Pedidos realizados</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8 flex items-center gap-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl">🔄</div>
              <div>
                <p className="text-4xl font-bold">{stats.inProgress}</p>
                <p className="text-gray-600">En progreso</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8 flex items-center gap-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center text-3xl">⭐</div>
              <div>
                <p className="text-4xl font-bold">{stats.rating}</p>
                <p className="text-gray-600">Calificación promedio</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main CTA */}
        <Card className="mb-12 bg-gradient-to-br from-orange-600 via-orange-700 to-red-600 text-white overflow-hidden">
          <CardContent className="p-16 text-center">
            <ShoppingBag className="h-20 w-20 mx-auto mb-8 opacity-90" />
            <h2 className="text-5xl font-bold mb-6">Encuentra el servicio perfecto</h2>
            <p className="text-2xl mb-10 max-w-2xl mx-auto opacity-90">
              Miles de gigs locales en Colombia. Encuentra freelancers confiables para tu proyecto.
            </p>
            <Button asChild size="lg" className="bg-white text-orange-700 hover:bg-gray-100 text-2xl px-16 py-8 rounded-3xl font-semibold shadow-xl">
              <Link href="/gigs">Ver Todos los Gigs</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-xl transition group">
            <CardContent className="p-10">
              <div className="bg-green-100 w-16 h-16 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition">
                <MessageCircle className="h-9 w-9 text-green-600" />
              </div>
              <h3 className="text-3xl font-semibold mb-3">Chats Activos</h3>
              <p className="text-gray-600 mb-8">Habla directamente con los vendedores</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/orders">Ir a Mis Chats</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition group">
            <CardContent className="p-10">
              <div className="bg-blue-100 w-16 h-16 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition">
                <Package className="h-9 w-9 text-blue-600" />
              </div>
              <h3 className="text-3xl font-semibold mb-3">Pedidos Recientes</h3>
              <p className="text-gray-600 mb-8">Revisa el estado de tus últimas compras</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/orders">Ver Mis Pedidos</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
