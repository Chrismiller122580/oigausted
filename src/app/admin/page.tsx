"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ToastProvider"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Order {
  id: string
  gigTitle: string
  price: number
  status: string
  createdAt: string
  buyer?: string
  seller?: string
  paidToSeller?: boolean
}

export default function AdminDashboard() {
  const router = useRouter()
  const { showToast } = useToast()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [commissionRate, setCommissionRate] = useState(12)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [pendingPayouts, setPendingPayouts] = useState(0)

  useEffect(() => {
    const userStr = localStorage.getItem("oigausted-user")
    if (!userStr) {
      router.push("/login")
      return
    }

    const user = JSON.parse(userStr)
    setCurrentUser(user)

    if (user.role !== "admin") {
      showToast("Acceso denegado. Solo administradores.", "error")
      router.push("/profile")
      return
    }

    // Load orders
    const savedOrders = localStorage.getItem("oigausted-orders")
    if (savedOrders) {
      const parsedOrders: Order[] = JSON.parse(savedOrders)
      setOrders(parsedOrders)

      const revenue = parsedOrders.reduce((sum, o) => sum + (o.price * commissionRate / 100), 0)
      setTotalRevenue(revenue)

      const pending = parsedOrders.filter(o => o.status === "Completed" && !o.paidToSeller).length
      setPendingPayouts(pending)
    }

    // Simulate users
    setUsers([
      { id: "1", name: "Chris Miller", email: "chris@demo.com", role: "admin" },
      { id: "2", name: "Juan Comprador", email: "buyer@demo.com", role: "buyer" },
      { id: "3", name: "Maria Vendedora", email: "seller@demo.com", role: "seller" },
    ])
  }, [router, showToast, commissionRate])

  const markAsPaid = (orderId: string) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, paidToSeller: true } : order
    )
    setOrders(updatedOrders)
    localStorage.setItem("oigausted-orders", JSON.stringify(updatedOrders))
    showToast("Pago al vendedor marcado como realizado", "success")
  }

  const changeCommission = (newRate: number) => {
    setCommissionRate(newRate)
    showToast(`Comisión actualizada a ${newRate}%`, "success")
  }

  if (!currentUser || currentUser.role !== "admin") {
    return <div className="container py-12 text-center">Acceso denegado.</div>
  }

  const completedOrders = orders.filter(o => o.status === "Completed")

  return (
    <div className="container mx-auto py-12 px-6">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Bienvenido, {currentUser.name}</p>
        </div>
        <Button onClick={() => router.push("/profile")}>Volver a Perfil</Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white border rounded-3xl p-8 text-center">
          <p className="text-sm text-gray-500">Ingresos Plataforma</p>
          <p className="text-4xl font-bold text-green-600 mt-2">${totalRevenue.toLocaleString("es-CO")}</p>
        </div>
        <div className="bg-white border rounded-3xl p-8 text-center">
          <p className="text-sm text-gray-500">Total Gigs</p>
          <p className="text-4xl font-bold mt-2">124</p>
        </div>
        <div className="bg-white border rounded-3xl p-8 text-center">
          <p className="text-sm text-gray-500">Usuarios</p>
          <p className="text-4xl font-bold mt-2">{users.length}</p>
        </div>
        <div className="bg-white border rounded-3xl p-8 text-center">
          <p className="text-sm text-gray-500">Pendientes de Pago</p>
          <p className="text-4xl font-bold text-orange-600 mt-2">{pendingPayouts}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white border rounded-3xl p-8">
          <h2 className="text-xl font-semibold mb-6">Órdenes Recientes</h2>
          {orders.length === 0 ? (
            <p className="text-gray-500 py-8 text-center">No hay órdenes recientes.</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {orders.slice(0, 8).map((order) => (
                <div key={order.id} className="flex justify-between items-center border-b pb-4 last:border-0">
                  <div>
                    <p className="font-medium">{order.gigTitle}</p>
                    <p className="text-sm text-gray-500">Por {order.buyer || "Comprador"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${order.price.toLocaleString("es-CO")}</p>
                    <span className={`text-xs px-3 py-1 rounded-full mt-1 inline-block ${
                      order.status === "Completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payout Tracking */}
        <div className="bg-white border rounded-3xl p-8">
          <h2 className="text-xl font-semibold mb-6">Pagos Pendientes a Vendedores</h2>
          {completedOrders.length === 0 ? (
            <p className="text-gray-500 py-8 text-center">No hay pagos pendientes.</p>
          ) : (
            <div className="space-y-4">
              {completedOrders.map((order) => (
                <div key={order.id} className="flex justify-between items-center border rounded-2xl p-5">
                  <div>
                    <p className="font-medium">{order.gigTitle}</p>
                    <p className="text-sm text-gray-500">Vendedor: {order.seller}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">${(order.price * 0.88).toLocaleString("es-CO")}</p>
                    <Button 
                      size="sm" 
                      className="mt-3 bg-green-600 hover:bg-green-700"
                      onClick={() => markAsPaid(order.id)}
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

      {/* Commission Control */}
      <div className="mt-12 bg-white border rounded-3xl p-8">
        <h2 className="text-xl font-semibold mb-6">Control de Comisiones</h2>
        <div className="flex items-center gap-8">
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-2">Porcentaje de comisión de la plataforma</p>
            <input 
              type="range" 
              min="5" 
              max="25" 
              value={commissionRate} 
              onChange={(e) => setCommissionRate(parseInt(e.target.value))}
              className="w-full accent-yellow-600"
            />
          </div>
          <div className="text-6xl font-bold text-green-600 w-32 text-right">
            {commissionRate}%
          </div>
        </div>
        <Button onClick={() => showToast(`Comisión actualizada a ${commissionRate}%`, "success")} className="mt-6">
          Guardar Comisión Global
        </Button>
      </div>
    </div>
  )
}
