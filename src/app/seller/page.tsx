"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MessageCircle, Eye, DollarSign } from "lucide-react"

export default function SellerDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders")
      if (res.ok) {
        const data = await res.json()
        // Show only orders where the logged-in user is the seller (using demo seller ID for now)
        const myOrders = data.orders?.filter((order: any) => 
          order.sellerId === "2" || order.seller?.id === "2"
        ) || []
        setOrders(myOrders)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold">Panel de Vendedor</h1>
            <p className="text-gray-600 mt-2">Gestiona tus órdenes y chats con compradores</p>
          </div>
          <Button asChild size="lg">
            <Link href="/create-gig">+ Nuevo Gig</Link>
          </Button>
        </div>

        <Card>
          <CardContent className="p-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold flex items-center gap-3">
                Órdenes Recibidas 
                <span className="text-orange-600">({orders.length})</span>
              </h2>
              <Button variant="ghost" asChild>
                <Link href="/orders">Ver todas las órdenes →</Link>
              </Button>
            </div>

            {loading ? (
              <p className="text-center py-20 text-gray-500">Cargando órdenes...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">Aún no tienes órdenes recibidas</p>
                <p className="text-sm text-gray-400 mt-2">Cuando un comprador compre tu gig, aparecerá aquí</p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                    <CardContent className="p-8 flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-xl">{order.gig?.title}</h3>
                        <p className="text-gray-600 mt-1">
                          Comprador: {order.buyer?.name || "Comprador"}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-lg text-green-600">
                            ${order.price?.toLocaleString("es-CO")}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <Button asChild variant="outline">
                          <Link href={`/orders/${order.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalle
                          </Link>
                        </Button>
                        <Button asChild>
                          <Link href={`/orders/${order.id}`}>
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Responder Chat
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
