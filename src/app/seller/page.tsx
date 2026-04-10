"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle, BarChart3, DollarSign, Package } from "lucide-react"
import GrokAssistant from "@/components/common/GrokAssistant"

export default function SellerDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [gigs, setGigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.email) return

    fetchMyGigs()
  }, [session])

  const fetchMyGigs = async () => {
    try {
      const res = await fetch("/api/gigs")
      const data = await res.json()
      
      // Filter only gigs belonging to current seller
      const myGigs = data.gigs.filter((gig: any) => 
        gig.seller.email === session?.user?.email ||
        gig.seller.id === (session?.user as any)?.id
      )
      
      setGigs(myGigs)
    } catch (error) {
      console.error("Failed to fetch my gigs", error)
    } finally {
      setLoading(false)
    }
  }

  const totalGigs = gigs.length
  const totalEarnings = gigs.reduce((sum, gig) => sum + (gig.price || 0), 0)
  const avgPrice = totalGigs > 0 ? Math.round(totalEarnings / totalGigs) : 0

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-6">
        {/* Welcome Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900">
            ¡Bienvenido de nuevo, {session?.user?.name?.split(" ")[0] || "Vendedor"}!
          </h1>
          <p className="text-xl text-gray-600 mt-2">Aquí está el resumen de tu negocio</p>
        </div>

        {/* Stats Cards */}
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

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-12">
          <Link href="/create-gig">
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 text-lg rounded-2xl flex items-center gap-3">
              <PlusCircle size={24} />
              Crear Nuevo Gig
            </Button>
          </Link>
          <Link href="/seller/earnings">
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg rounded-2xl flex items-center gap-3">
              <BarChart3 size={24} />
              Ver Ganancias
            </Button>
          </Link>
          <Link href="/seller/profile">
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg rounded-2xl flex items-center gap-3">
              Mi Negocio
            </Button>
          </Link>
        </div>

        {/* My Gigs Section */}
        <div className="bg-white rounded-3xl shadow-sm p-8">
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
                Publica tu primer servicio y empieza a recibir pedidos de clientes locales.
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
                <div key={gig.id} className="border rounded-3xl overflow-hidden hover:shadow-md transition">
                  {gig.imageUrl && (
                    <img
                      src={gig.imageUrl}
                      alt={gig.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="font-semibold text-xl mb-2 line-clamp-2">{gig.title}</h3>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <GrokAssistant />
    </div>
  )
}
