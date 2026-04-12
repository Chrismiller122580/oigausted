"use client"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function BuyerOrdersPage() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.email) return
    fetchOrders()
  }, [session])

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders")
      const data = await res.json()
      const buyerOrders = data.orders.filter((o: any) => 
        o.buyer.email === session?.user?.email || 
        o.buyer.id === (session?.user as any)?.id
      )
      setOrders(buyerOrders)
    } catch (error) {
      console.error("Failed to fetch orders", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="container py-20 text-center">Cargando órdenes...</div>

  return (
    <div className="container mx-auto py-12 px-6">
      <h1 className="text-4xl font-bold mb-10">Mis Órdenes</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl border-gray-300 bg-gray-50">
          <p className="text-2xl text-gray-500">Aún no tienes órdenes</p>
          <Link href="/gigs" className="text-orange-600 hover:underline mt-4 inline-block">
            Explorar gigs →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block bg-white border rounded-3xl p-6 hover:shadow-lg transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{order.gig?.title || "Orden"}</h3>
                  <p className="text-sm text-gray-500">Vendedor: {order.seller?.name || order.seller?.businessName}</p>
                </div>
                <span className={`px-4 py-2 text-xs font-medium rounded-full ${
                  order.status === "Completed" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                }`}>
                  {order.status}
                </span>
              </div>
              <p className="text-2xl font-bold text-orange-600 mt-4">
                ${order.price?.toLocaleString("es-CO")} COP
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
