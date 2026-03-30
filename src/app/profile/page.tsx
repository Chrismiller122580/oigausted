"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useToast } from "@/components/ToastProvider"

export default function ProfilePage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [myGigs, setMyGigs] = useState<any[]>([])
  const [myOrders, setMyOrders] = useState<any[]>([])
  const [mySales, setMySales] = useState<any[]>([])

  useEffect(() => {
    const userStr = localStorage.getItem("oigausted-user")
    if (!userStr) {
      router.push("/login")
      return
    }

    const user = JSON.parse(userStr)
    setCurrentUser(user)

    // Load gigs
    const savedGigs = localStorage.getItem("oigausted-gigs")
    if (savedGigs) {
      const allGigs = JSON.parse(savedGigs)
      setMyGigs(allGigs.filter((g: any) => g.seller === user.name))
    }

    // Load orders
    const savedOrders = localStorage.getItem("oigausted-orders")
    if (savedOrders) {
      const allOrders = JSON.parse(savedOrders)
      const userOrders = allOrders.filter((o: any) => o.buyer === "Tú (Comprador)" || o.buyer?.includes(user.name))
      const userSales = allOrders.filter((o: any) => o.seller === user.name)
      setMyOrders(userOrders)
      setMySales(userSales)
    }
  }, [router])

  if (!currentUser) {
    return <div className="container py-12 text-center">Cargando perfil...</div>
  }

  return (
    <div className="container mx-auto py-12 px-6 max-w-5xl">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold">Mi Perfil</h1>
          <p className="text-gray-600 mt-2">Bienvenido, {currentUser.name} • {currentUser.role}</p>
        </div>
        <Button onClick={() => router.push("/seller")}>Ir a Panel de Vendedor</Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Link href="/gigs" className="block bg-white border rounded-3xl p-8 hover:shadow-xl transition-all text-center">
          <h3 className="font-semibold text-xl mb-2">Explorar Gigs</h3>
          <p className="text-gray-500">Buscar servicios locales</p>
        </Link>
        <Link href="/create-gig" className="block bg-white border rounded-3xl p-8 hover:shadow-xl transition-all text-center">
          <h3 className="font-semibold text-xl mb-2">Publicar Gig</h3>
          <p className="text-gray-500">Ofrece tus habilidades</p>
        </Link>
        <Link href="/profile" className="block bg-white border rounded-3xl p-8 hover:shadow-xl transition-all text-center border-yellow-500 bg-yellow-50">
          <h3 className="font-semibold text-xl mb-2">Mis Pedidos</h3>
          <p className="text-gray-500">Ver {myOrders.length} pedidos activos</p>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white border rounded-3xl p-8 text-center">
          <p className="text-4xl font-bold text-green-600">{myGigs.length}</p>
          <p className="text-sm text-gray-500 mt-2">Gigs Publicados</p>
        </div>
        <div className="bg-white border rounded-3xl p-8 text-center">
          <p className="text-4xl font-bold text-blue-600">{myOrders.length}</p>
          <p className="text-sm text-gray-500 mt-2">Pedidos Realizados</p>
        </div>
        <div className="bg-white border rounded-3xl p-8 text-center">
          <p className="text-4xl font-bold text-purple-600">{mySales.length}</p>
          <p className="text-sm text-gray-500 mt-2">Ventas Completadas</p>
        </div>
      </div>

      {/* My Orders Quick View */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Mis Pedidos Recientes</h2>
          <Button asChild variant="outline">
            <Link href="/profile">Ver todos mis pedidos</Link>
          </Button>
        </div>
        {myOrders.length === 0 ? (
          <p className="text-gray-500 py-8 text-center border rounded-3xl">Aún no tienes pedidos.</p>
        ) : (
          <div className="grid gap-4">
            {myOrders.slice(0, 3).map((order: any) => (
              <Link key={order.id} href={`/orders/${order.id}`} className="block bg-white border rounded-3xl p-6 hover:shadow-md transition-all">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{order.gigTitle}</p>
                    <p className="text-sm text-gray-500">Estado: {order.status}</p>
                  </div>
                  <p className="font-semibold text-green-600">${order.price}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Business Info for Sellers */}
      {currentUser.role === "seller" && (
        <div className="bg-white border rounded-3xl p-8">
          <h2 className="text-xl font-semibold mb-6">Información de Negocio</h2>
          <p className="text-gray-500">Aquí puedes agregar NIT, nombre de empresa, etc. (próximamente editable).</p>
        </div>
      )}
    </div>
  )
}
