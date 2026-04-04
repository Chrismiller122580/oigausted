"use client"
import { useSession, signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

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
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Mi Perfil de Comprador</h1>
          <p className="text-gray-600">Bienvenido, {session?.user?.name || "Comprador"}</p>
        </div>
        
        {/* Role Switch Button - Prominent */}
        <Button 
          onClick={handleSwitchToSeller} 
          className="bg-yellow-600 hover:bg-yellow-700 text-lg px-8 py-6"
        >
          Cambiar a Modo Vendedor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Compras Realizadas</CardTitle></CardHeader>
          <CardContent><p className="text-5xl font-bold text-yellow-600">{myPurchases.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Órdenes Completadas</CardTitle></CardHeader>
          <CardContent><p className="text-5xl font-bold text-green-600">{completedOrders}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Gastado</CardTitle></CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-green-600">
              ${myPurchases.reduce((sum, o) => sum + (o.price || 0), 0).toLocaleString()} COP
            </p>
          </CardContent>
        </Card>
      </div>

      {/* My Purchases */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Mis Compras</h2>
        {myPurchases.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">Aún no has realizado ninguna compra.</p>
            <Button onClick={() => router.push("/gigs")} className="mt-6">
              Explorar Gigs
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myPurchases.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <CardTitle>{order.gigTitle || "Orden"}</CardTitle>
                  <p className="text-sm text-gray-500">Vendedor: {order.seller}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-yellow-600">${order.price?.toLocaleString()} COP</p>
                  <p className="text-xs text-orange-600 mt-2">{order.status || "En progreso"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-8 text-center hover:shadow-xl transition-all cursor-pointer" onClick={() => router.push("/gigs")}>
          <h3 className="text-xl font-semibold">Explorar más Gigs</h3>
          <p className="text-gray-600 mt-2">Encuentra servicios que necesitas hoy</p>
        </Card>
        
        <Card className="p-8 text-center hover:shadow-xl transition-all cursor-pointer">
          <h3 className="text-xl font-semibold">Ver Historial Completo</h3>
          <p className="text-gray-600 mt-2">Todas tus compras y calificaciones</p>
        </Card>
      </div>
    </div>
  )
}
