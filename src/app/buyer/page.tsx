"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBag, Star, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function BuyerPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [myPurchases, setMyPurchases] = useState<any[]>([])
  const [completedOrders, setCompletedOrders] = useState(0)

  const userName = session?.user?.name || "Comprador"
  const userEmail = session?.user?.email || ""

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem("oigausted-orders") || "[]")
    const buyerOrders = savedOrders.filter((o: any) =>
      o.buyerEmail === userEmail || o.buyer === userName
    )
    setMyPurchases(buyerOrders)
    setCompletedOrders(buyerOrders.filter((o: any) => o.status === "completed").length)
  }, [userEmail, userName])

  const totalSpent = myPurchases.reduce((sum, o) => sum + (o.price || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-6">
        {/* Welcome + Main CTA */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            ¡Hola, {userName.split(" ")[0]}!
          </h1>
          <p className="text-2xl text-gray-600 mb-8">¿Qué servicio necesitas hoy?</p>

          <Button 
            onClick={() => router.push("/gigs")} 
            size="lg" 
            className="bg-orange-600 hover:bg-orange-700 text-white text-xl px-16 py-8 rounded-3xl shadow-lg"
          >
            Explorar Gigs Disponibles
          </Button>
          <p className="text-gray-500 mt-4">Encuentra servicios locales cerca de ti</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-8">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-gray-500">
                <ShoppingBag className="w-6 h-6" /> Compras Realizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-6xl font-bold text-orange-600">{myPurchases.length}</p>
            </CardContent>
          </Card>

          <Card className="p-8">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-gray-500">
                <Star className="w-6 h-6" /> Órdenes Completadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-6xl font-bold text-green-600">{completedOrders}</p>
            </CardContent>
          </Card>

          <Card className="p-8">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-gray-500">
                <TrendingUp className="w-6 h-6" /> Total Gastado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-6xl font-bold text-yellow-600">
                ${totalSpent.toLocaleString("es-CO")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Purchases */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Mis Compras Recientes</h2>
            <Link href="/orders" className="text-orange-600 hover:underline text-sm font-medium">
              Ver todas las órdenes →
            </Link>
          </div>

          {myPurchases.length === 0 ? (
            <Card className="p-12 text-center">
              <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-2xl font-medium text-gray-600 mb-3">Aún no has comprado nada</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Explora los gigs disponibles y encuentra el servicio perfecto para ti.
              </p>
              <Button onClick={() => router.push("/gigs")} size="lg" className="bg-orange-600 hover:bg-orange-700">
                Explorar Gigs Ahora
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myPurchases.slice(0, 6).map((order) => (
                <Card key={order.id} className="hover:shadow-md transition">
                  <CardHeader>
                    <CardTitle className="line-clamp-2 text-lg">{order.gigTitle || "Orden"}</CardTitle>
                    <p className="text-sm text-gray-500">Vendedor: {order.seller}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-orange-600">
                      ${order.price?.toLocaleString("es-CO")} COP
                    </p>
                    <p className={`text-sm mt-3 font-medium ${order.status === "completed" ? "text-green-600" : "text-orange-600"}`}>
                      {order.status || "En progreso"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
