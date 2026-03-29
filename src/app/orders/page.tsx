"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

interface Order {
  id: string
  gigTitle: string
  price: number
  status: "Pending" | "In Progress" | "Review" | "Completed"
  createdAt: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("oigausted-orders")
    if (saved) setOrders(JSON.parse(saved))
  }, [])

  return (
    <div className="container mx-auto py-12 px-6">
      <h1 className="text-4xl font-bold mb-10">Mis Órdenes</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl border-gray-300 bg-gray-50">
          <p className="text-2xl text-gray-500">Aún no tienes órdenes</p>
          <Link href="/gigs" className="text-yellow-600 hover:underline mt-4 inline-block">
            Explorar gigs →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link 
              key={order.id} 
              href={`/orders/${order.id}`}
              className="block bg-white border rounded-3xl p-6 hover:shadow-lg transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{order.gigTitle}</h3>
                  <p className="text-sm text-gray-500">${order.price.toLocaleString("es-CO")}</p>
                </div>
                <span className={`px-4 py-2 text-xs font-medium rounded-full ${
                  order.status === "Completed" ? "bg-green-100 text-green-700" :
                  order.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                  order.status === "Review" ? "bg-purple-100 text-purple-700" : "bg-yellow-100 text-yellow-700"
                }`}>
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Creado {new Date(order.createdAt).toLocaleDateString("es-CO")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
