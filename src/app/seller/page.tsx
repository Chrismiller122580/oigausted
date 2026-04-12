"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlusCircle, BarChart3, DollarSign, Package, ShoppingBag, Trash2 } from "lucide-react"
import GrokAssistant from "@/components/common/GrokAssistant"

export default function SellerDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [gigs, setGigs] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.email) return
    fetchData()
  }, [session])

  const fetchData = async () => {
    try {
      const gigsRes = await fetch("/api/gigs")
      const gigsData = await gigsRes.json()
      const myGigs = gigsData.gigs.filter((gig: any) => 
        gig.seller.email === session?.user?.email || 
        gig.seller.id === (session?.user as any)?.id
      )
      setGigs(myGigs)

      const ordersRes = await fetch("/api/orders")
      const ordersData = await ordersRes.json()
      const mySales = ordersData.orders.filter((order: any) => 
        order.seller.email === session?.user?.email || 
        order.seller.id === (session?.user as any)?.id
      )
      setSales(mySales)
    } catch (error) {
      console.error("Failed to fetch data", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGig = async (gigId: string) => {
    if (!confirm("¿Estás seguro de eliminar este gig? Esta acción no se puede deshacer.")) return

    try {
      const res = await fetch(`/api/gigs/${gigId}`, { method: "DELETE" })
      if (res.ok) {
        setGigs(gigs.filter(g => g.id !== gigId))
        alert("Gig eliminado correctamente")
      } else {
        alert("Error al eliminar el gig")
      }
    } catch (error) {
      console.error("Delete error", error)
      alert("Error al eliminar el gig")
    }
  }

  const totalGigs = gigs.length
  const totalEarnings = sales.reduce((sum, order) => sum + (order.price || 0), 0)
  const avgPrice = totalGigs > 0 ? Math.round(totalEarnings / totalGigs) : 0

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900">
            ¡Bienvenido de nuevo, {session?.user?.name?.split(" ")[0] || "Vendedor"}!
          </h1>
          <p className="text-xl text-gray-600 mt-2">Aquí está el resumen de tu negocio</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Gigs Publicados</p>
                <p className="text-5xl font-bold text-gray-900 mt-2">{totalGigs}</p>
              </div>
              <Package className="w-12 h-12 text-orange-500" />
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ingresos Totales</p>
                <p className="text-5xl font-bold text-green-600 mt-2">
                  ${totalEarnings.toLocaleString("es-CO")}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Precio Promedio</p>
                <p className="text-5xl font-bold text-amber-600 mt-2">
                  ${avgPrice.toLocaleString("es-CO")}
                </p>
              </div>
              <BarChart3 className="w-12 h-12 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-12">
          <Link href="/create-gig">
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 text-lg rounded-2xl flex items-center gap-3">
              <PlusCircle size={24} />
              Crear Nuevo Gig
            </Button>
          </Link>
        </div>

        {/* Mis Gigs Publicados */}
        <div className="bg-white rounded-3xl shadow-sm p-8 mb-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold">Mis Gigs Publicados</h2>
            <Link href="/create-gig" className="text-orange-600 hover:underline flex items-center gap-1">
              + Agregar nuevo
            </Link>
          </div>

          {totalGigs === 0 ? (
            <div className="text-center py-20">
              <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-medium text-gray-900 mb-3">Aún no tienes gigs</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-8">
                Publica tu primer servicio y empieza a recibir pedidos.
              </p>
              <Link href="/create-gig">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                  Crear mi primer Gig
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gigs.map((gig) => (
                <div key={gig.id} className="group relative border rounded-3xl overflow-hidden hover:shadow-md transition">
                  <Link href={`/gigs/${gig.id}`} className="block">
                    {gig.imageUrl && (
                      <img src={gig.imageUrl} alt={gig.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
                    )}
                    <div className="p-6">
                      <h3 className="font-semibold text-xl mb-2 line-clamp-2 group-hover:text-orange-600">{gig.title}</h3>
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4">{gig.description}</p>
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-3xl font-bold text-orange-600">
                            ${gig.price?.toLocaleString("es-CO")}
                          </span>
                        </div>
                        <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                          {gig.category}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDeleteGig(gig.id)
                    }}
                    className="absolute top-4 right-4 bg-white/90 hover:bg-red-50 text-red-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                    title="Eliminar gig"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mis Ventas */}
        <div className="bg-white rounded-3xl shadow-sm p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <ShoppingBag className="w-6 h-6" />
              Mis Ventas
            </h2>
            <span className="text-sm text-gray-500">{sales.length} órdenes recibidas</span>
          </div>

          {sales.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              Aún no tienes ventas. Tus gigs aparecerán aquí cuando los clientes compren.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sales.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`} className="block">
                  <Card className="hover:shadow-md transition">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-2">{order.gig?.title}</h3>
                      <p className="text-sm text-gray-500 mb-4">Comprador: {order.buyer?.name || "Comprador"}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-orange-600">
                          ${order.price.toLocaleString("es-CO")}
                        </span>
                        <span className={`px-4 py-1 text-xs rounded-full ${order.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {order.status}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <GrokAssistant />
    </div>
  )
}
