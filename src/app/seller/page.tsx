"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function SellerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [myGigs, setMyGigs] = useState<any[]>([])
  const [earnings, setEarnings] = useState(0)
  const [activeOrders, setActiveOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const userEmail = session?.user?.email || ""
  const userName = session?.user?.name || "Vendedor Demo"

  useEffect(() => {
    if (status === "loading") return

    const loadData = () => {
      try {
        const savedGigs = JSON.parse(localStorage.getItem("oigausted-gigs") || "[]")
        
        const sellerGigs = savedGigs.filter((g: any) => 
          g.sellerEmail === userEmail || 
          (g.seller && g.seller.toLowerCase().includes(userName.toLowerCase()))
        )

        setMyGigs(sellerGigs)
        const total = sellerGigs.reduce((sum: number, gig: any) => sum + (gig.price || 0), 0)
        setEarnings(total)

        const savedOrders = JSON.parse(localStorage.getItem("oigausted-orders") || "[]")
        const sellerOrders = savedOrders.filter((o: any) => 
          o.sellerEmail === userEmail || 
          (o.seller && o.seller.toLowerCase().includes(userName.toLowerCase()))
        )
        setActiveOrders(sellerOrders)
      } catch (e) {
        console.error("Error loading seller data", e)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userEmail, userName, status])

  const deleteGig = (id: string) => {
    if (!confirm("¿Eliminar este gig?")) return
    
    let gigs = JSON.parse(localStorage.getItem("oigausted-gigs") || "[]")
    gigs = gigs.filter((g: any) => g.id !== id)
    localStorage.setItem("oigausted-gigs", JSON.stringify(gigs))
    
    setMyGigs(myGigs.filter(g => g.id !== id))
    alert("Gig eliminado correctamente")
  }

  if (status === "loading" || loading) {
    return <div className="p-12 text-center">Cargando dashboard...</div>
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Mi Dashboard de Vendedor</h1>
          <p className="text-gray-600">Bienvenido, {userName}</p>
        </div>
        <Button onClick={() => router.push("/create-gig")} className="bg-yellow-600 hover:bg-yellow-700">
          + Publicar Nuevo Gig
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Gigs Publicados</CardTitle></CardHeader>
          <CardContent><p className="text-5xl font-bold text-yellow-600">{myGigs.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Ganancias Estimadas</CardTitle></CardHeader>
          <CardContent><p className="text-5xl font-bold text-green-600">${earnings.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Órdenes Activas</CardTitle></CardHeader>
          <CardContent><p className="text-5xl font-bold">{activeOrders.length}</p></CardContent>
        </Card>
      </div>

      {/* My Published Gigs */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Mis Gigs Publicados</h2>
        {myGigs.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">Aún no tienes gigs publicados.</p>
            <Button onClick={() => router.push("/create-gig")} className="mt-6">
              Crear mi primer Gig
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGigs.map((gig) => (
              <Card key={gig.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{gig.title}</CardTitle>
                  <p className="text-2xl font-semibold text-yellow-600">
                    ${gig.price?.toLocaleString() || "0"} COP
                  </p>
                  <p className="text-sm text-gray-500">{gig.category}</p>
                </CardHeader>
                <CardFooter className="flex gap-3 pt-0">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/create-gig?edit=${gig.id}`}>Editar</Link>
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteGig(gig.id)}>
                    Eliminar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Earnings */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Mis Pagos y Ganancias</h2>
        <Card>
          <CardContent className="p-8">
            <p className="text-4xl font-bold text-green-600 mb-2">${earnings.toLocaleString()} COP</p>
            <p className="text-gray-500">Ganancias estimadas basadas en gigs publicados</p>
            <div className="mt-6 text-sm text-gray-500">
              Nota: Los pagos reales se procesarán cuando integremos Wompi.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Orders */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Órdenes Activas</h2>
        {activeOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No tienes órdenes activas todavía.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6 flex justify-between">
                  <div>
                    <h3>{order.gigTitle || "Orden"}</h3>
                    <p className="text-sm text-gray-500">Comprador: {order.buyer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${order.price?.toLocaleString()}</p>
                    <p className="text-xs text-orange-600">{order.status}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
