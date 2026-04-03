"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function BuyerDashboard() {
  const { data: session } = useSession()
  const [myOrders, setMyOrders] = useState<any[]>([])

  const currentUserName = session?.user?.name || "Comprador"

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem("oigausted-orders") || "[]")
    const buyerOrders = savedOrders.filter((o: any) => 
      o.buyer && o.buyer.toLowerCase().includes(currentUserName.toLowerCase())
    )
    setMyOrders(buyerOrders)
  }, [currentUserName])

  return (
    <div className="container py-8 max-w-5xl mx-auto px-4">
      <div className="mb-10">
        <h1 className="text-4xl font-bold">Mi Dashboard de Comprador</h1>
        <p className="text-gray-600">Bienvenido, {currentUserName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-5xl font-bold text-yellow-600">{myOrders.length}</p>
            <p className="text-sm text-gray-500 mt-2">Mis Compras</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-5xl font-bold text-green-600">0</p>
            <p className="text-sm text-gray-500 mt-2">En Progreso</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-5xl font-bold">0</p>
            <p className="text-sm text-gray-500 mt-2">Completadas</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-semibold mb-6">Mis Compras Recientes</h2>
      
      {myOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 text-lg">Aún no has realizado ninguna compra.</p>
          <Button asChild className="mt-6">
            <Link href="/gigs">Explorar Gigs</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <h3 className="font-medium text-lg">{order.gigTitle}</h3>
                <p className="text-sm text-gray-500 mt-1">Vendedor: {order.seller}</p>
                <p className="text-2xl font-bold text-yellow-600 mt-4">
                  ${order.price.toLocaleString()} COP
                </p>
                <div className="mt-6 flex gap-3">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/orders/${order.id}`}>Ver Detalles / Chat</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
