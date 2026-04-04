"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Clock, CheckCircle, Star } from "lucide-react"

export default function BuyerDashboard() {
  const { data: session } = useSession()
  const [myOrders, setMyOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const currentUserName = session?.user?.name || "Comprador"

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem("oigausted-orders") || "[]")
    const buyerOrders = savedOrders.filter((o: any) => 
      o.buyer && o.buyer.toLowerCase().includes(currentUserName.toLowerCase())
    )
    setMyOrders(buyerOrders)
    setLoading(false)
  }, [currentUserName])

  if (loading) {
    return <div className="container py-12 text-center">Cargando tus compras...</div>
  }

  return (
    <div className="container py-8 max-w-5xl mx-auto px-4">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2">Mi Dashboard de Comprador</h1>
        <p className="text-gray-600">Bienvenido, {currentUserName}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-5xl font-bold text-yellow-600">{myOrders.length}</p>
            <p className="text-sm text-gray-500 mt-2">Total Compras</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-5xl font-bold text-green-600">
              {myOrders.filter(o => o.status === "Completed").length}
            </p>
            <p className="text-sm text-gray-500 mt-2">Completadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-5xl font-bold text-orange-600">
              {myOrders.filter(o => o.status === "Pending").length}
            </p>
            <p className="text-sm text-gray-500 mt-2">En Progreso</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-semibold mb-6">Mis Compras Recientes</h2>

      {myOrders.length === 0 ? (
        <Card className="p-16 text-center">
          <p className="text-2xl text-gray-400 mb-6">Aún no has realizado ninguna compra</p>
          <Button asChild size="lg">
            <Link href="/gigs">Explorar Gigs Disponibles</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{order.gigTitle}</h3>
                    <p className="text-sm text-gray-500">Vendedor: {order.seller}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-yellow-600">
                      ${order.price.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/orders/${order.id}`}>Ver Chat</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href={`/orders/${order.id}`}>Ver Detalles</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
