"use client"
import { useState, useEffect } from "react"

export default function AdminOverview() {
  const [orders, setOrders] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    const savedOrders = localStorage.getItem("oigausted-orders")
    if (savedOrders) setOrders(JSON.parse(savedOrders))

    const savedUsers = localStorage.getItem("oigausted-users")
    if (savedUsers) setUsers(JSON.parse(savedUsers))
  }, [])

  const totalRevenue = orders.reduce((sum, o) => sum + (o.price || 0), 0)
  const pendingPayouts = orders.filter(o => !o.paidToSeller).length
  const completedOrders = orders.filter(o => o.status === "Completed").length
  const totalUsers = users.length

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-10">Overview</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8">
            <p className="text-gray-400">Ingresos Totales</p>
            <p className="text-5xl font-bold text-green-400 mt-4">${totalRevenue}</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8">
            <p className="text-gray-400">Pagos Pendientes</p>
            <p className="text-5xl font-bold text-orange-400 mt-4">{pendingPayouts}</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8">
            <p className="text-gray-400">Pedidos Completados</p>
            <p className="text-5xl font-bold text-blue-400 mt-4">{completedOrders}</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8">
            <p className="text-gray-400">Usuarios Totales</p>
            <p className="text-5xl font-bold text-purple-400 mt-4">{totalUsers}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
