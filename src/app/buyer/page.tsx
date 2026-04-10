"use client"
import { useSession, signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ShoppingBag, Star, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function BuyerPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [myPurchases, setMyPurchases] = useState<any[]>([])
  const [completedOrders, setCompletedOrders] = useState(0)
  const userEmail = session?.user?.email || ""

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem("oigausted-orders") || "[]")
    const buyerOrders = savedOrders.filter((o: any) =>
      o.buyerEmail === userEmail || o.buyer === session?.user?.name
    )
    setMyPurchases(buyerOrders)
    setCompletedOrders(buyerOrders.filter((o: any) => o.status === "completed").length)
  }, [userEmail, session])

  const totalSpent = myPurchases.reduce((sum, o) => sum + (o.price || 0), 0)

  const handleSwitchToSeller = async () => {
    await signIn("credentials", {
      email: session?.user?.email,
      password: "123",
      role: "seller",
      redirect: false
    })
    router.push("/seller")
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-6">

        {/* Single Top-Right Avatar */}
        <div className="flex justify-end mb-10">
          <Link 
            href="/profile" 
            className="flex items-center gap-3 hover:bg-white px-5 py-3 rounded-2xl transition group"
          >
            <div className="text-right">
              <p className="font-semibold text-sm group-hover:text-orange-600">
                {session?.user?.name || "Comprador"}
              </p>
              <p className="text-xs text-emerald-600">Comprador</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
              👤
            </div>
          </Link>
        </div>

        {/* Welcome */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900">
            ¡Hola, {session?.user?.name?.split(" ")[0] || "Comprador"}!
          </h1>
          <p className="text-2xl text-gray-600 mt-3">¿Qué servicio necesitas hoy?</p>
        </div>

        {/* Main CTA */}
        <div className="mb-12 text-center">
          <Button 
            onClick={() => router.push("/gigs")} 
            size="lg"
            className="bg-orange-600 hover:bg-orange-700 text-white text-xl px-16 py-8 rounded-3xl shadow-lg"
          >
            Explorar Gigs Disponibles
          </Button>
          <p className="text-gray-500 mt-4">Encuentra servicios locales cerca de ti</p>
        </div>

        {/* Navigation Links */}
        <div className="flex gap-4 mb-12">
          <Button variant="outline" onClick={() => router.push("/orders")} className="flex-1 py-6">
            Mis Pedidos
          </Button>
          <Button variant="outline" onClick={() => router.push("/profile")} className="flex-1 py-6">
            Mi Perfil
          </Button>
        </div>

        {/* Stats */}
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
              <p className="text-6xl font-bold text-green-600">
                ${totalSpent.toLocaleString("es-CO")}
              </p>
              <p className="text-sm text-gray-500 mt-1">COP</p>
            </CardContent>
          </Card>
        </div>

        {/* My Purchases */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-semibold">Mis Compras Recientes</h2>
            <Button variant="outline" onClick={() => router.push("/orders")}>
              Ver todo el historial
            </Button>
          </div>

          {myPurchases.length === 0 ? (
            <Card className="p-16 text-center">
              <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-medium mb-3">Aún no has comprado nada</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-8">
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
                    <CardTitle className="line-clamp-2">{order.gigTitle || "Orden"}</CardTitle>
                    <p className="text-sm text-gray-500">Vendedor: {order.seller}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-yellow-600">
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
