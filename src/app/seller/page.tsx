"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, Package, Trash2 } from "lucide-react"
import { toast } from "react-hot-toast"

const statusConfig: any = {
  Pending: { label: "Pendiente de pago", color: "bg-orange-100 text-orange-700" },
  Paid: { label: "Pagado ✓", color: "bg-green-100 text-green-700" },
  "In Progress": { label: "En progreso", color: "bg-blue-100 text-blue-700" },
  Completed: { label: "Completado", color: "bg-emerald-100 text-emerald-700" }
}

export default function SellerDashboard() {
  const { data: session, status } = useSession()
  const [gigs, setGigs] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session?.user?.email) {
      setLoading(false)
      return
    }
    fetchGigs()
    fetchOrders()
  }, [session, status])

  const fetchGigs = async () => {
    try {
      const res = await fetch("/api/gigs?role=seller", {
        credentials: "include",
        cache: "no-store",
        next: { revalidate: 0 }
      })
      if (res.ok) {
        const data = await res.json()
        setGigs(data.gigs || [])
      } else if (res.status === 401) {
        toast.error("Sesión expirada")
      }
    } catch (err) {
      console.error("Error fetching gigs:", err)
    }
  }

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders?role=seller", {
        credentials: "include",
        cache: "no-store",
        next: { revalidate: 0 }
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      } else if (res.status === 401) {
        toast.error("Sesión expirada")
      }
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError("No se pudieron cargar los pedidos")
    } finally {
      setLoading(false)
    }
  }

  const deleteGig = async (gigId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este gig? Esta acción no se puede deshacer.")) return
    try {
      const res = await fetch(`/api/gigs/${gigId}`, { 
        method: "DELETE",
        credentials: "include"
      })
      if (res.ok) {
        toast.success("Gig eliminado correctamente")
        fetchGigs()
      } else {
        toast.error("No se pudo eliminar el gig")
      }
    } catch (err) {
      toast.error("Error al eliminar el gig")
    }
  }

  const activeOrders = orders.filter(o => o.status !== "Completed")
  const totalEarnings = orders
    .filter(o => o.status === "Completed")
    .reduce((sum, o) => sum + (o.price || 0), 0)

  const thisMonthEarnings = orders
    .filter(o => {
      const orderDate = new Date(o.createdAt)
      const now = new Date()
      return orderDate.getMonth() === now.getMonth() && 
             orderDate.getFullYear() === now.getFullYear() &&
             o.status === "Completed"
    })
    .reduce((sum, o) => sum + (o.price || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Intentar nuevamente</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="pt-8 pb-10">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Hola, Vendedor</h1>
          <p className="text-lg sm:text-xl text-gray-600 mt-3">Gestiona tus gigs y pedidos</p>
        </div>

        {/* Stats Cards - Mobile friendly stacking */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 sm:p-4 rounded-2xl">
                <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ganancias Totales</p>
                <p className="text-3xl sm:text-4xl font-bold">${totalEarnings.toLocaleString("es-CO")}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 sm:p-4 rounded-2xl">
                <Package className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pedidos Activos</p>
                <p className="text-3xl sm:text-4xl font-bold">{activeOrders.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 sm:p-4 rounded-2xl">
                <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Este Mes</p>
                <p className="text-3xl sm:text-4xl font-bold">${thisMonthEarnings.toLocaleString("es-CO")}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Active Orders - Better mobile layout */}
        <Card className="mb-10">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-semibold">Pedidos Activos ({activeOrders.length})</h2>
              <Link href="/orders" className="text-orange-600 hover:underline text-sm font-medium self-start sm:self-auto">
                Ver todos los pedidos →
              </Link>
            </div>

            {activeOrders.length === 0 ? (
              <p className="text-gray-500 py-12 text-center">No tienes pedidos activos en este momento.</p>
            ) : (
              <div className="space-y-4">
                {activeOrders.slice(0, 5).map((order: any) => (
                  <Link key={order.id} href={`/orders/${order.id}`} className="block">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 border rounded-3xl hover:bg-gray-50 hover:border-orange-500 transition-all active:scale-[0.985]">
                      <div className="flex-1 mb-3 sm:mb-0">
                        <p className="font-medium text-base sm:text-lg">{order.gig?.title || "Orden sin título"}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Orden #{order.id.slice(0,8)} • ${order.price?.toLocaleString("es-CO")}
                        </p>
                      </div>
                      <div className={`px-5 py-2 rounded-full text-sm font-medium text-center sm:text-left ${statusConfig[order.status]?.color || 'bg-gray-100'}`}>
                        {statusConfig[order.status]?.label || order.status}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Gigs */}
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold">Mis Gigs ({gigs.length})</h2>
            </div>

            {gigs.length === 0 ? (
              <p className="text-gray-500 py-16 text-center">Aún no tienes gigs publicados.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gigs.map((gig: any) => (
                  <Card key={gig.id} className="overflow-hidden hover:shadow-lg transition">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg sm:text-xl line-clamp-2">{gig.title}</h3>
                          <p className="text-2xl font-bold text-orange-600 mt-3">
                            ${gig.price?.toLocaleString("es-CO")}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteGig(gig.id)}
                          className="text-red-500 hover:bg-red-50 flex-shrink-0"
                        >
                          <Trash2 size={20} />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-5 line-clamp-3">{gig.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
