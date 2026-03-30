"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Gig {
  id: string
  title: string
  price: number
  category: string
  sellerId?: string
}

interface Order {
  id: string
  gigTitle: string
  price: number
  status: string
  createdAt: string
}

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [myGigs, setMyGigs] = useState<Gig[]>([])
  const [myOrders, setMyOrders] = useState<Order[]>([])
  const [stats, setStats] = useState({
    gigsPublished: 0,
    ordersBought: 0,
    totalSpent: 0
  })

  useEffect(() => {
    const userStr = localStorage.getItem("oigausted-user")
    if (!userStr) {
      window.location.href = "/login"
      return
    }

    const user = JSON.parse(userStr)
    setCurrentUser(user)

    // Load gigs created by this user
    const savedGigsStr = localStorage.getItem("oigausted-gigs")
    let userGigs: Gig[] = []
    if (savedGigsStr) {
      const allGigs: Gig[] = JSON.parse(savedGigsStr)
      userGigs = allGigs.filter(g => g.sellerId === user.id)
      setMyGigs(userGigs)
    }

    // Load orders (as buyer)
    const savedOrdersStr = localStorage.getItem("oigausted-orders")
    let orders: Order[] = []
    if (savedOrdersStr) {
      orders = JSON.parse(savedOrdersStr)
      setMyOrders(orders)
    }

    const totalSpent = orders.reduce((sum, order) => sum + order.price, 0)

    setStats({
      gigsPublished: userGigs.length,
      ordersBought: orders.length,
      totalSpent
    })
  }, [])

  if (!currentUser) return <div className="container py-12">Redirigiendo...</div>

  return (
    <div className="container mx-auto py-12 px-6 max-w-5xl">
      <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
        <div className="w-28 h-28 bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-3xl flex items-center justify-center text-6xl flex-shrink-0">
          👤
        </div>
        <div>
          <h1 className="text-4xl font-bold">Mi Perfil</h1>
          <p className="text-xl mt-1">{currentUser.name}</p>
          <p className="text-gray-600">{currentUser.email}</p>
          <span className="inline-block mt-2 px-4 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            {currentUser.role.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Gigs (only own) */}
        <div className="bg-white border rounded-3xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Mis Gigs Publicados</h2>
            <Link href="/create-gig">
              <Button>+ Nuevo Gig</Button>
            </Link>
          </div>

          {myGigs.length === 0 ? (
            <p className="text-gray-500 py-12 text-center">Aún no has publicado ningún gig.</p>
          ) : (
            <div className="space-y-4">
              {myGigs.map((gig) => (
                <div key={gig.id} className="border rounded-2xl p-5 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <h3 className="font-medium">{gig.title}</h3>
                    <p className="text-sm text-gray-500">{gig.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-yellow-600">${gig.price.toLocaleString("es-CO")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Orders */}
        <div className="bg-white border rounded-3xl p-8">
          <h2 className="text-2xl font-semibold mb-6">Mis Órdenes</h2>

          {myOrders.length === 0 ? (
            <p className="text-gray-500 py-12 text-center">Aún no has realizado compras.</p>
          ) : (
            <div className="space-y-4">
              {myOrders.map((order) => (
                <Link 
                  key={order.id} 
                  href={`/orders/${order.id}`}
                  className="block border rounded-2xl p-5 hover:shadow-md transition-all hover:border-yellow-300"
                >
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium">{order.gigTitle}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString("es-CO")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-yellow-600">${order.price.toLocaleString("es-CO")}</p>
                      <span className={`inline-block mt-2 px-4 py-1 text-xs rounded-full ${
                        order.status === "Completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
