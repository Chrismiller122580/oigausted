"use client"

import { PrismaClient } from "@prisma/client"
import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const prisma = new PrismaClient()

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
  }, [])

  const totalRevenue = orders.reduce((sum, order) => sum + order.platformFee, 0)
  const totalOrders = orders.length

  const chartData = orders.slice(0, 7).map((order, index) => ({
    name: `Orden ${index + 1}`,
    earnings: order.platformFee,
  }))

  const pieData = [
    { name: 'Plataforma', value: totalRevenue },
    { name: 'Vendedores', value: orders.reduce((sum, order) => sum + order.sellerPayout, 0) },
  ]

  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-2">Dashboard de Ganancias</h1>
      <p className="text-muted-foreground mb-10">Ingresos de la plataforma (12% comisión)</p>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white border rounded-3xl p-8 text-center">
          <p className="text-sm text-muted-foreground">Ganancias Totales</p>
          <p className="text-5xl font-bold text-yellow-600 mt-3">
            ${totalRevenue.toLocaleString("es-CO")}
          </p>
        </div>
        <div className="bg-white border rounded-3xl p-8 text-center">
          <p className="text-sm text-muted-foreground">Órdenes Totales</p>
          <p className="text-5xl font-bold mt-3">{totalOrders}</p>
        </div>
        <div className="bg-white border rounded-3xl p-8 text-center">
          <p className="text-sm text-muted-foreground">Comisión Promedio</p>
          <p className="text-5xl font-bold mt-3">
            ${(totalRevenue / (totalOrders || 1)).toFixed(0)}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white border rounded-3xl p-8">
          <h3 className="font-semibold mb-6">Ganancias por Orden (Últimas)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="earnings" fill="#eab308" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border rounded-3xl p-8">
          <h3 className="font-semibold mb-6">Distribución de Ingresos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-12">
        <h3 className="font-semibold mb-6">Últimas Órdenes</h3>
        <div className="bg-white border rounded-3xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4">Gig</th>
                <th className="text-left p-4">Comprador</th>
                <th className="text-left p-4">Vendedor</th>
                <th className="text-right p-4">Total Pagado</th>
                <th className="text-right p-4">Ganancia Plataforma</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="p-4 font-medium">{order.gig.title}</td>
                  <td className="p-4">{order.buyer.name || "Usuario"}</td>
                  <td className="p-4">{order.seller.name || "Vendedor"}</td>
                  <td className="p-4 text-right">${order.amount.toLocaleString("es-CO")}</td>
                  <td className="p-4 text-right text-yellow-600 font-medium">
                    ${order.platformFee.toLocaleString("es-CO")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
