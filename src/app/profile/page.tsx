"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

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
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [myGigs, setMyGigs] = useState<Gig[]>([])
  const [myOrders, setMyOrders] = useState<Order[]>([])
  const [mySales, setMySales] = useState<Order[]>([])
  const [stats, setStats] = useState({
    gigsPublished: 0,
    ordersBought: 0,
    totalSpent: 0,
    totalEarned: 0
  })

  useEffect(() => {
    const userStr = localStorage.getItem("oigausted-user")
    if (!userStr) {
      router.push("/login")
      return
    }

    const user = JSON.parse(userStr)
    setCurrentUser(user)

    // My Gigs (only own)
    const savedGigsStr = localStorage.getItem("oigausted-gigs")
    let userGigs: Gig[] = []
    if (savedGigsStr) {
      const allGigs: Gig[] = JSON.parse(savedGigsStr)
      userGigs = allGigs.filter(g => g.sellerId === user.id)
      setMyGigs(userGigs)
    }

    // My Orders (as buyer)
    const savedOrdersStr = localStorage.getItem("oigausted-orders")
    let orders: Order[] = []
    if (savedOrdersStr) {
      orders = JSON.parse(savedOrdersStr)
      setMyOrders(orders)
    }

    // My Sales (as seller)
    let sales: Order[] = []
    if (savedOrdersStr) {
      const allOrders: Order[] = JSON.parse(savedOrdersStr)
      sales = allOrders.filter(o => o.seller === user.name)
      setMySales(sales)
    }

    const totalSpent = orders.reduce((sum, order) => sum + order.price, 0)
    const totalEarned = sales.reduce((sum, order) => sum + order.price, 0)

    setStats({
      gigsPublished: userGigs.length,
      ordersBought: orders.length,
      totalSpent,
      totalEarned
    })
  }, [router])

  if (!currentUser) {
    return <div className="container py-12 text-center">Redirigiendo a login...</div>
  }

  return (
    <div className="container mx-auto py-12 px-6 max-w-6xl">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stats */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white border rounded-3xl p-8 text-center">
            <p className="text-4xl font-bold text-yellow-600">{stats.gigsPublished}</p>
            <p className="text-sm text-gray-500 mt-2">Gigs Publicados</p>
          </div>
          <div className="bg-white border rounded-3xl p-8 text-center">
            <p className="text-4xl font-bold text-yellow-600">{stats.ordersBought}</p>
            <p className="text-sm text-gray-500 mt-2">Órdenes Compradas</p>
          </div>
          <div className="bg-white border rounded-3xl p-8 text-center">
            <p className="text-4xl font-bold text-yellow-600">${stats.totalSpent.toLocaleString("es-CO")}</p>
            <p className="text-sm text-gray-500 mt-2">Total Gastado</p>
          </div>
          <div className="bg-white border rounded-3xl p-8 text-center">
            <p className="text-4xl font-bold text-green-600">${stats.totalEarned.toLocaleString("es-CO")}</p>
            <p className="text-sm text-gray-500 mt-2">Total Ganado</p>
          </div>
        </div>

        {/* My Gigs */}
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
          <h2 className="text-2xl font-semibold mb-6">Mis Órdenes (Compras)</h2>
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

        {/* My Sales */}
        <div className="bg-white border rounded-3xl p-8">
          <h2 className="text-2xl font-semibold mb-6">Mis Ventas</h2>
          {mySales.length === 0 ? (
            <p className="text-gray-500 py-12 text-center">Aún no tienes ventas registradas.</p>
          ) : (
            <div className="space-y-4">
              {mySales.map((sale) => (
                <Link 
                  key={sale.id} 
                  href={`/orders/${sale.id}`}
                  className="block border rounded-2xl p-5 hover:shadow-md transition-all hover:border-yellow-300"
                >
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium">{sale.gigTitle}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(sale.createdAt).toLocaleDateString("es-CO")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">${sale.price.toLocaleString("es-CO")}</p>
                      <span className={`inline-block mt-2 px-4 py-1 text-xs rounded-full ${
                        sale.status === "Completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {sale.status}
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
