"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingBag, Package, MessageCircle, Star, Clock } from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

export default function BuyerDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState({ 
    orders: 0, 
    inProgress: 0, 
    completed: 0,
    pendingReviews: 0 
  })
  const [pendingReviewOrders, setPendingReviewOrders] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const userName = session?.user?.name?.split(' ')[0] || 'Comprador'

  useEffect(() => {
    const uid = (session?.user as any)?.id
    if (!uid) {
      setLoading(false)
      return
    }

    const userId = uid

    Promise.all([
      fetch('/api/orders?role=buyer').then(res => res.json()),
      fetch(`/api/reviews?reviewerId=${userId}&limit=100`).then(res => res.json()).catch(() => ({ reviews: [] }))
    ])
    .then(([ordersData, reviewsData]) => {
      const orders = Array.isArray(ordersData) ? ordersData : []
      const userReviews = reviewsData.reviews || []

      const completedOrders = orders.filter(o => o.status === 'Completed')
      const reviewedOrderIds = new Set(userReviews.map((r: any) => r.orderId))

      const pending = completedOrders.filter(o => !reviewedOrderIds.has(o.id))

      setStats({
        orders: orders.length,
        inProgress: orders.filter(o => ['Pending', 'Paid', 'In Progress'].includes(o.status)).length,
        completed: completedOrders.length,
        pendingReviews: pending.length
      })

      setPendingReviewOrders(pending.slice(0, 3))
      setRecentOrders(orders.slice(0, 4)) // most recent 4
    })
    .catch(console.error)
    .finally(() => setLoading(false))
  }, [session])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Cargando tu panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-foreground">Hola, {userName} 👋</h1>
            <p className="text-xl text-muted-foreground mt-3">¿Qué servicio necesitas hoy en Bucaramanga?</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardContent className="p-8 flex items-center gap-6">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-3xl">📦</div>
              <div>
                <p className="text-4xl font-bold text-foreground">{stats.orders}</p>
                <p className="text-muted-foreground">Pedidos realizados</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8 flex items-center gap-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-3xl">🔄</div>
              <div>
                <p className="text-4xl font-bold text-foreground">{stats.inProgress}</p>
                <p className="text-muted-foreground">En progreso</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8 flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-3xl">✅</div>
              <div>
                <p className="text-4xl font-bold text-foreground">{stats.completed}</p>
                <p className="text-muted-foreground">Completados</p>
              </div>
            </CardContent>
          </Card>

          <Card className={stats.pendingReviews > 0 ? "border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40" : ""}>
            <CardContent className="p-8 flex items-center gap-6">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center text-3xl">⭐</div>
              <div>
                <p className="text-4xl font-bold text-foreground">{stats.pendingReviews}</p>
                <p className="text-muted-foreground">Reseñas pendientes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main CTA */}
        <Card className="mb-12 bg-gradient-to-br from-orange-600 via-orange-700 to-red-600 text-white overflow-hidden">
          <CardContent className="p-16 text-center">
            <ShoppingBag className="h-20 w-20 mx-auto mb-8 opacity-90" />
            <h2 className="text-5xl font-bold mb-6">Encuentra el servicio perfecto</h2>
            <p className="text-2xl mb-10 max-w-2xl mx-auto opacity-90">
              Miles de gigs locales en Colombia. Encuentra freelancers confiables para tu proyecto.
            </p>
            <Button asChild size="lg" className="bg-card text-orange-700 hover:bg-muted text-2xl px-16 py-8 rounded-3xl font-semibold shadow-xl">
              <Link href="/gigs">Ver Todos los Gigs</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Pending Reviews - High Impact for Beta */}
        {pendingReviewOrders.length > 0 && (
          <Card className="mb-12 border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40">
            <CardContent className="p-10">
              <div className="flex items-center gap-3 mb-6">
                <Star className="h-8 w-8 text-orange-600" />
                <h3 className="text-2xl font-semibold text-foreground">Reseñas pendientes</h3>
                <span className="bg-orange-600 text-white text-sm px-3 py-0.5 rounded-full">
                  {stats.pendingReviews}
                </span>
              </div>
              <p className="text-muted-foreground mb-6">Tus opiniones ayudan a otros compradores. ¡Toma un minuto para calificar!</p>
              
              <div className="space-y-3">
                {pendingReviewOrders.map(order => (
                  <div key={order.id} className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-background p-4 rounded-2xl border">
                    <div>
                      <p className="font-medium text-lg text-foreground">{order.gig?.title || "Servicio"}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.seller?.businessName || order.seller?.name || "Vendedor"} • ${(order.price || 0).toLocaleString('es-CO')}
                        {order.createdAt && ` • ${new Date(order.createdAt).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}`}
                      </p>
                    </div>
                    <Button asChild size="sm" className="w-full md:w-auto">
                      <Link href={`/orders/${order.id}?tab=review`}>
                        Dejar reseña
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Orders Preview */}
        {recentOrders.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-2xl font-semibold text-foreground">Tus pedidos recientes</h3>
              <Link href="/orders" className="text-sm text-orange-600 hover:underline flex items-center gap-1">
                Ver todos <Clock className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentOrders.map(order => {
                const statusColor = 
                  order.status === 'Completed' ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30' :
                  order.status === 'In Progress' ? 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30' :
                  order.status === 'Cancelled' ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30' :
                  'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
                return (
                  <Link key={order.id} href={`/orders/${order.id}`} className="block">
                    <Card className="hover:shadow-md transition h-full">
                      <CardContent className="p-5 flex justify-between items-start">
                        <div className="min-w-0">
                          <p className="font-medium text-lg truncate text-foreground">{order.gig?.title || 'Servicio'}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {order.seller?.businessName || order.seller?.name || 'Vendedor'}
                          </p>
                          <p className="text-sm mt-1 font-semibold text-foreground">${(order.price || 0).toLocaleString('es-CO')}</p>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${statusColor}`}>
                          {order.status}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-xl transition group">
            <CardContent className="p-10">
              <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition">
                <MessageCircle className="h-9 w-9 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-3xl font-semibold mb-3 text-foreground">Chats Activos</h3>
              <p className="text-muted-foreground mb-8">Habla directamente con los vendedores</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/orders">Ir a Mis Chats</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition group">
            <CardContent className="p-10">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition">
                <Package className="h-9 w-9 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-3xl font-semibold mb-3 text-foreground">Todos tus pedidos</h3>
              <p className="text-muted-foreground mb-8">Historial completo y seguimiento</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/orders">Ver Mis Pedidos</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Become Seller nudge (only for pure buyers) */}
        {session?.user?.role === 'buyer' && (
          <div className="mt-10 text-center">
            <p className="text-muted-foreground">
              ¿Tienes habilidades para ofrecer?{' '}
              <Link href="/profile" className="text-orange-600 font-medium hover:underline">
                Conviértete en vendedor en tu perfil
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
