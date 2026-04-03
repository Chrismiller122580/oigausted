"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingBag, ArrowRight, Clock, CheckCircle } from "lucide-react"

export default function BuyerProfile() {
  const { data: session } = useSession()
  const router = useRouter()
  const [myOrders, setMyOrders] = useState<any[]>([])

  const currentUserName = session?.user?.name || ""

  const loadOrders = () => {
    const savedOrders = localStorage.getItem("oigausted-orders")
    if (savedOrders) {
      setMyOrders(JSON.parse(savedOrders))
    }
  }

  useEffect(() => {
    loadOrders()

    const handleFocus = () => loadOrders()
    window.addEventListener("focus", handleFocus)
    
    return () => window.removeEventListener("focus", handleFocus)
  }, [])

  const totalSpent = myOrders.reduce((sum, order) => sum + (order.price || 0), 0)
  const activeOrders = myOrders.filter(o => o.status !== "Completed")
  const completedOrders = myOrders.filter(o => o.status === "Completed")

  return (
    <div className="container py-10 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-5xl font-bold tracking-tight">Mi Perfil de Comprador</h1>
          <p className="text-2xl text-gray-600 mt-3">Hola, {currentUserName}</p>
        </div>
        <Button onClick={() => router.push("/gigs")} size="lg" className="bg-yellow-600 hover:bg-yellow-700">
          Explorar Gigs <ArrowRight className="ml-2" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white border rounded-3xl p-8 text-center shadow-sm">
          <div className="text-6xl font-bold text-yellow-600 mb-3">${totalSpent.toLocaleString()}</div>
          <p className="text-gray-600 font-medium">Total Gastado</p>
        </div>
        <div className="bg-white border rounded-3xl p-8 text-center shadow-sm">
          <div className="text-6xl font-bold text-blue-600 mb-3">{activeOrders.length}</div>
          <p className="text-gray-600 font-medium">Órdenes Activas</p>
        </div>
      </div>

      {/* Active Orders */}
      <div className="bg-white border rounded-3xl p-10 mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-semibold flex items-center gap-3">
            <ShoppingBag className="w-9 h-9" /> Órdenes Activas
          </h2>
        </div>

        {activeOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No tienes órdenes activas en este momento.</p>
        ) : (
          <div className="grid gap-6">
            {activeOrders.map((order) => (
              <div key={order.id} className="border rounded-2xl p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all">
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold">{order.gigTitle}</h3>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">${order.price}</p>
                  <p className="text-sm text-gray-500 mt-3">
                    Estado: <span className="font-medium capitalize text-gray-700">{order.status}</span>
                  </p>
                </div>
                <Button 
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className="md:w-auto w-full py-6 text-lg"
                >
                  Ver Detalle
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Orders */}
      {completedOrders.length > 0 && (
        <div className="bg-white border rounded-3xl p-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-semibold flex items-center gap-3">
              <CheckCircle className="w-9 h-9 text-green-600" /> Órdenes Completadas
            </h2>
          </div>

          <div className="grid gap-6">
            {completedOrders.map((order) => (
              <div key={order.id} className="border rounded-2xl p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-green-50/50">
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold">{order.gigTitle}</h3>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">${order.price}</p>
                  <p className="text-sm text-green-700 mt-3">
                    Completada • Calificación: {order.rating ? "★".repeat(order.rating) : "Sin calificar"}
                  </p>
                  {order.reviewComment && (
                    <p className="text-sm text-gray-600 mt-2 italic">"{order.reviewComment}"</p>
                  )}
                </div>
                <Button 
                  onClick={() => router.push(`/orders/${order.id}`)}
                  variant="outline"
                  className="md:w-auto w-full py-6 text-lg"
                >
                  Ver Detalle
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
