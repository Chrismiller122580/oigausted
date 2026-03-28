"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const COLORS = ['#eab308', '#f59e0b', '#d97706']

export default function EarningsDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data.orders || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalRevenue = orders.reduce((sum, order) => sum + (order.platformFee || 0), 0)
  const totalOrders = orders.length
  const avgCommission = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

  const barData = orders.slice(0, 8).map((order, i) => ({
    name: `Orden ${i+1}`,
    earnings: order.platformFee || 0,
  }))

  const pieData = [
    { name: 'Plataforma (12%)', value: totalRevenue, fill: '#eab308' },
    { name: 'Vendedores (88%)', value: orders.reduce((sum, order) => sum + (order.sellerPayout || 0), 0), fill: '#d1d5db' },
  ]

  return (
    <div className="container py-12 px-6">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard de Ganancias</h1>
          <p className="text-muted-foreground mt-1">Ingresos de la plataforma (12% comisión)</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total recaudado este mes</p>
          <p className="text-5xl font-bold text-yellow-600 mt-1">
            ${totalRevenue.toLocaleString("es-CO")}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white border rounded-3xl p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Órdenes Completadas</p>
          <p className="text-5xl font-bold mt-3">{totalOrders}</p>
        </div>
        <div className="bg-white border rounded-3xl p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Comisión Promedio</p>
          <p className="text-5xl font-bold mt-3">${avgCommission}</p>
        </div>
        <div className="bg-white border rounded-3xl p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Tasa de Comisión</p>
          <p className="text-5xl font-bold mt-3 text-yellow-600">12%</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <div className="bg-white border rounded-3xl p-8">
          <h3 className="font-semibold mb-6">Ganancias por Orden Reciente</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(value) => [`$${value}`, 'Ganancia Plataforma']} />
              <Bar dataKey="earnings" fill="#eab308" radius={6} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white border rounded-3xl p-8">
          <h3 className="font-semibold mb-6">Distribución de Ingresos</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${value.toLocaleString("es-CO")}`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-8 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span>Plataforma (12%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-300"></div>
              <span>Vendedores (88%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="mt-12">
        <h3 className="font-semibold text-xl mb-6">Últimas Órdenes</h3>
        <div className="bg-white border rounded-3xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-5">Gig</th>
                <th className="text-left p-5">Comprador</th>
                <th className="text-left p-5">Vendedor</th>
                <th className="text-right p-5">Total Pagado</th>
                <th className="text-right p-5">Ganancia Plataforma</th>
                <th className="text-center p-5">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.slice(0, 10).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="p-5 font-medium">{order.gig.title}</td>
                  <td className="p-5">{order.buyer.name || "Usuario"}</td>
                  <td className="p-5">{order.seller.name || "Vendedor"}</td>
                  <td className="p-5 text-right font-medium">${order.amount.toLocaleString("es-CO")}</td>
                  <td className="p-5 text-right text-yellow-600 font-semibold">
                    ${order.platformFee.toLocaleString("es-CO")}
                  </td>
                  <td className="p-5 text-center text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("es-CO")}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground">
                    Aún no hay órdenes. Realiza algunas compras para ver las ganancias.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
