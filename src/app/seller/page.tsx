"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlusCircle, DollarSign, Package, Trash2 } from "lucide-react"
import { toast } from "react-hot-toast"

const statusConfig: any = {
  Pending: { label: "Pendiente de pago", color: "bg-orange-100 text-orange-700" },
  Paid: { label: "Pagado ✓", color: "bg-green-100 text-green-700" },
  "In Progress": { label: "En progreso", color: "bg-blue-100 text-blue-700" },
  Completed: { label: "Completado", color: "bg-emerald-100 text-emerald-700" }
}

export default function SellerDashboard() {
  const [gigs, setGigs] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGigs()
    fetchOrders()
  }, [])

  const fetchGigs = async () => {
    try {
      const res = await fetch("/api/gigs?role=seller")
      if (res.ok) {
        const data = await res.json()
        setGigs(data.gigs || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders?role=seller")
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const deleteGig = async (gigId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este gig? Esta acción no se puede deshacer.")) return

    try {
      const res = await fetch(`/api/gigs/${gigId}`, { method: "DELETE" })
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
    return <div className="min-h-screen flex items-center justify-center">Cargando dashboard del vendedor...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-5xl font-bold tracking-tight">Hola, Vendedor</h1>
            <p className="text-xl text-gray-600 mt-3">Gestiona tus gigs y pedidos</p>
          </div>
          <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700">
            <Link href="/create-gig" className="flex items-center gap-3">
              <PlusCircle size={24} />
              Crear Nuevo Gig
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-4 rounded-2xl">
                  <DollarSign className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ganancias Totales</p>
                  <p className="text-4xl font-bold">${totalEarnings.toLocaleString("es-CO")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-4 rounded-2xl">
                  <Package className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pedidos Activos</p>
                  <p className="text-4xl font-bold">{activeOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="bg-amber-100 p-4 rounded-2xl">
                  <DollarSign className="h-10 w-10 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Este Mes</p>
                  <p className="text-4xl font-bold">${thisMonthEarnings.toLocaleString("es-CO")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Orders */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Pedidos Activos ({activeOrders.length})</h2>
              <Link href="/orders" className="text-orange-600 hover:underline text-sm font-medium">
                Ver todos los pedidos →
              </Link>
            </div>

            {activeOrders.length === 0 ? (
              <p className="text-gray-500 py-12 text-center">No tienes pedidos activos en este momento.</p>
            ) : (
              <div className="space-y-4">
                {activeOrders.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-6 border rounded-3xl hover:bg-gray-50 transition">
                    <div>
                      <p className="font-medium">{order.gig?.title}</p>
                      <p className="text-sm text-gray-500">Orden #{order.id.slice(0,8)} • ${order.price?.toLocaleString("es-CO")}</p>
                    </div>
                    <div className={`px-5 py-2 rounded-full text-sm font-medium ${statusConfig[order.status]?.color || 'bg-gray-100'}`}>
                      {statusConfig[order.status]?.label || order.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Gigs */}
        <Card>
          <CardContent className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold">Mis Gigs ({gigs.length})</h2>
              <Button asChild>
                <Link href="/create-gig">Crear Nuevo Gig</Link>
              </Button>
            </div>

            {gigs.length === 0 ? (
              <p className="text-gray-500 py-16 text-center">Aún no tienes gigs publicados.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gigs.map((gig: any) => (
                  <Card key={gig.id} className="overflow-hidden hover:shadow-lg transition">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-xl line-clamp-2">{gig.title}</h3>
                          <p className="text-2xl font-bold text-orange-600 mt-3">
                            ${gig.price?.toLocaleString("es-CO")}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteGig(gig.id)}
                          className="text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={20} />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-4 line-clamp-3">{gig.description}</p>
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
