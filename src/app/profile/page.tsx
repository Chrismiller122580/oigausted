"use client"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ToastProvider"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [myGigs, setMyGigs] = useState<any[]>([])
  const [myOrders, setMyOrders] = useState<any[]>([])
  const [mySales, setMySales] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const { showToast } = useToast()

  useEffect(() => {
    if (status === "loading") return

    // Load from localStorage as fallback
    const userStr = localStorage.getItem("oigausted-user")
    if (userStr) setCurrentUser(JSON.parse(userStr))

    // Load gigs
    const savedGigs = localStorage.getItem("oigausted-gigs")
    if (savedGigs) {
      const allGigs = JSON.parse(savedGigs)
      const userName = session?.user?.name || currentUser?.name || ""
      setMyGigs(allGigs.filter((g: any) => g.seller === userName))
    }

    // Load orders
    const savedOrders = localStorage.getItem("oigausted-orders")
    if (savedOrders) {
      const orders = JSON.parse(savedOrders)
      const userName = session?.user?.name || currentUser?.name || ""
      setMyOrders(orders.filter((o: any) => o.buyer === userName))
      setMySales(orders.filter((o: any) => o.seller === userName))
    }
  }, [session, status, currentUser])

  const handleLogout = async () => {
    localStorage.removeItem("oigausted-user")
    await signOut({ redirect: false })
    window.location.href = "/login"
  }

  if (status === "loading") {
    return <div className="p-12 text-center">Cargando perfil...</div>
  }

  const userName = session?.user?.name || currentUser?.name || "Usuario"
  const userRole = (session?.user as any)?.role || currentUser?.role || "buyer"

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Mi Perfil</h1>
          <Button onClick={handleLogout} variant="outline">
            Cerrar Sesión
          </Button>
        </div>

        <div className="bg-white rounded-3xl shadow p-8 mb-8">
          <p className="text-2xl">Hola, <span className="font-semibold">{userName}</span></p>
          <p className="text-gray-500 capitalize">Rol: {userRole}</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/create-gig">
            <Button className="w-full h-24 text-lg">Publicar Nuevo Gig</Button>
          </Link>
          <Link href="/gigs">
            <Button variant="outline" className="w-full h-24 text-lg">Explorar Gigs</Button>
          </Link>
          {userRole === "seller" && (
            <Link href="/seller">
              <Button variant="outline" className="w-full h-24 text-lg">Mi Dashboard de Vendedor</Button>
            </Link>
          )}
        </div>

        {/* My Gigs */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Mis Gigs Publicados</h2>
          {myGigs.length === 0 ? (
            <p className="text-gray-500">Aún no has publicado ningún gig.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myGigs.map((gig: any) => (
                <div key={gig.id} className="bg-white p-6 rounded-2xl border">
                  <h3 className="font-semibold text-lg">{gig.title}</h3>
                  <p className="text-2xl font-bold text-yellow-600 mt-2">${gig.price}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Orders */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Mis Pedidos</h2>
          {myOrders.length === 0 ? (
            <p className="text-gray-500">Aún no has comprado ningún gig.</p>
          ) : (
            <div className="space-y-4">
              {myOrders.map((order: any) => (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <div className="bg-white p-6 rounded-2xl border hover:border-yellow-600 transition-colors cursor-pointer">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{order.gigTitle}</p>
                        <p className="text-sm text-gray-500">Vendedor: {order.seller}</p>
                      </div>
                      <p className="font-bold text-lg">${order.price}</p>
                    </div>
                    <p className="text-sm mt-3 text-gray-500">Estado: {order.status}</p>
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
