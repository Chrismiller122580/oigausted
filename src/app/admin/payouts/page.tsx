"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ToastProvider"

export default function AdminPayouts() {
  const [orders, setOrders] = useState<any[]>([])
  const { showToast } = useToast()

  useEffect(() => {
    const savedOrders = localStorage.getItem("oigausted-orders")
    if (savedOrders) setOrders(JSON.parse(savedOrders))
  }, [])

  const markAsPaid = (orderId: string) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, paidToSeller: true, status: "Completed" } : order
    )
    setOrders(updatedOrders)
    localStorage.setItem("oigausted-orders", JSON.stringify(updatedOrders))
    showToast("Pago marcado como realizado al vendedor", "success")
  }

  const pending = orders.filter(o => !o.paidToSeller)

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-10">Pagos a Vendedores</h1>
        
        <div className="mb-8 bg-gray-900 border border-gray-700 rounded-3xl p-8">
          <p className="text-2xl">Total Pendiente: <span className="text-orange-400">${pending.reduce((sum, o) => sum + (o.price || 0), 0)}</span></p>
        </div>

        {pending.length === 0 ? (
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-12 text-center">
            <p className="text-2xl text-gray-400">No hay pagos pendientes en este momento.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pending.map((order) => (
              <div key={order.id} className="bg-gray-900 border border-gray-700 rounded-3xl p-8 flex justify-between items-center">
                <div>
                  <p className="font-medium text-lg">{order.gigTitle}</p>
                  <p className="text-gray-400">Vendedor: {order.seller}</p>
                  <p className="text-sm text-gray-500 mt-1">ID: {order.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-400">${order.price}</p>
                  <Button 
                    onClick={() => markAsPaid(order.id)} 
                    className="mt-4 bg-green-600 hover:bg-green-700 px-8"
                  >
                    Marcar como Pagado
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
