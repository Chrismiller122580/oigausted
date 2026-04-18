"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"

export default function BuyerOrdersPage() {
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session?.user?.email) {
      setLoading(false)
      return
    }
    fetchOrders()
  }, [session, status])

  const fetchOrders = async () => {
    try {
      setError(null)
      const res = await fetch("/api/orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",   // Critical for session cookies on Vercel
      })

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("No autorizado. Por favor inicia sesión nuevamente.")
        }
        throw new Error(`Error del servidor: ${res.status}`)
      }

      const data = await res.json()
      
      // Safe filtering
      const buyerOrders = (data.orders || []).filter((o: any) => 
        o.buyer?.email === session?.user?.email || 
        o.buyer?.id === (session?.user as any)?.id
      )

      setOrders(buyerOrders)
    } catch (err: any) {
      console.error("Failed to fetch orders:", err)
      setError(err.message || "No se pudieron cargar las órdenes")
      toast.error(err.message || "Error al cargar órdenes")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-20 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando tus órdenes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-20 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchOrders}>Intentar nuevamente</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-6">
      <h1 className="text-4xl font-bold mb-10">Mis Órdenes</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl border-gray-300 bg-gray-50">
          <p className="text-2xl text-gray-500">Aún no tienes órdenes</p>
          <Link 
            href="/gigs" 
            className="text-orange-600 hover:underline mt-6 inline-block text-lg font-medium"
          >
            Explorar gigs disponibles →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block bg-white border rounded-3xl p-6 hover:shadow-lg transition-all hover:border-orange-500"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg line-clamp-1">
                    {order.gig?.title || "Orden sin título"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Vendedor: {order.seller?.name || order.seller?.businessName || "Desconocido"}
                  </p>
                </div>
                <span className={`px-4 py-2 text-xs font-medium rounded-full whitespace-nowrap ${
                  order.status === "Completed" || order.status === "Approved"
                    ? "bg-green-100 text-green-700" 
                    : "bg-orange-100 text-orange-700"
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