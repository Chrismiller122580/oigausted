"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function AdminPayouts() {
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem("oigausted-orders") || "[]")
    setOrders(savedOrders)
  }, [])

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Payouts Management</h1>
      <div className="bg-white rounded-2xl shadow p-8">
        <p className="text-gray-600 mb-6">Total pending payouts: {orders.length}</p>
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-xl p-6 flex justify-between items-center">
              <div>
                <p className="font-medium">{order.gigTitle}</p>
                <p className="text-sm text-gray-500">Buyer: {order.buyer} • Seller: {order.seller}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">${order.price.toLocaleString()}</p>
                <Button variant="outline" size="sm" className="mt-2">Mark as Paid</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
