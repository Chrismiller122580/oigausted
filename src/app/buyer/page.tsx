"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBag, Star, TrendingUp, ArrowRight } from "lucide-react"
import Link from "next/link"
import GrokAssistant from "@/components/common/GrokAssistant"

export default function BuyerPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [myPurchases, setMyPurchases] = useState<any[]>([])
  const [completedOrders, setCompletedOrders] = useState(0)
  const [loading, setLoading] = useState(true)

  const userName = session?.user?.name || "Comprador"
  const userEmail = session?.user?.email || ""

  useEffect(() => {
    if (!session) return

    const fetchBuyerData = async () => {
      try {
        const res = await fetch("/api/orders")
        const data = await res.json()
        const buyerOrders = data.orders.filter((o: any) =>
          o.buyer?.email === userEmail || o.buyer?.name === userName
        )
        setMyPurchases(buyerOrders)
        setCompletedOrders(buyerOrders.filter((o: any) => o.status === "Completed").length)
      } catch (error) {
        console.error("Failed to fetch buyer orders", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBuyerData()
  }, [session, userEmail, userName])

  const totalSpent = myPurchases.reduce((sum, o) => sum + (o.price || 0), 0)

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando tu dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-6">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            ¡Hola, {userName}!
          </h1>
          <p className="text-2xl text-gray-600 mt-3">¿Qué servicio necesitas hoy?</p>
        </div>

        {/* Main CTA */}
        <div className="mb-12 text-center">
          <Button
            onClick={() => router.push("/gigs")}
            size="lg"
            className="bg-orange-600 hover:bg-orange-700 text-white text-xl px-16 py-8 rounded-3xl shadow-lg flex items-center gap-3 mx-auto"
          >
            Explorar Gigs Disponibles
            <ArrowRight size={28} />
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
              <p className="text-6xl font-bold text-yellow-600">{myPurchases.length}</p>
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
              <p className="text-6xl font-bold text-orange-600">
                ${totalSpent.toLocaleString("es-CO")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Purchases - Now Clickable */}
        <div className="bg-white rounded-3xl shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">Compras Recientes</h2>

          {myPurchases.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-2xl text-gray-500 mb-6">Aún no has comprado nada</p>
              <Button onClick={() => router.push("/gigs")} size="lg" className="bg-orange-600 hover:bg-orange-700">
                Explorar Gigs Ahora
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myPurchases.slice(0, 6).map((order) => (
                <Link 
                  key={order.id} 
                  href={`/orders/${order.id}`}
                  className="block"
                >
                  <Card className="hover:shadow-md transition hover:border-orange-500">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{order.gig?.title || "Orden"}</h3>
                      <p className="text-sm text-gray-500 mb-4">Vendedor: {order.seller?.name || "Vendedor"}</p>
                      <div className="flex justify-between items-end">
                        <span className="text-3xl font-bold text-yellow-600">
                          ${order.price?.toLocaleString("es-CO")}
                        </span>
                        <span className={`px-4 py-1 text-xs rounded-full font-medium ${
                          order.status === "Completed" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                        }`}>
                          {order.status || "En progreso"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <GrokAssistant />
    </div>
  )
}
