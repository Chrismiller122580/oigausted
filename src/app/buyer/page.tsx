"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingBag, Package, MessageCircle, Star, Clock, RefreshCw, CheckCircle } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import OnboardingTutorial from "@/components/common/OnboardingTutorial"
import { usePlatformConfig } from "@/components/providers/PlatformConfigProvider"
import { markTutorialDismissed, shouldAutoShowTutorial } from "@/lib/tutorial"
import { MegaSearchBar } from "@/components/homepage/MegaSearchBar"

export default function BuyerDashboard() {
  const { data: session } = useSession()
  const { config: platformConfig } = usePlatformConfig()
  const [stats, setStats] = useState({ 
    orders: 0, 
    inProgress: 0, 
    completed: 0,
    pendingReviews: 0 
  })
  const [pendingReviewOrders, setPendingReviewOrders] = useState<import('@/types/order').OrderDetail[]>([])
  const [recentOrders, setRecentOrders] = useState<import('@/types/order').OrderDetail[]>([])
  const [loading, setLoading] = useState(true)

  // Tutorial / onboarding for new buyers (full training)
  const [showTutorial, setShowTutorial] = useState(false)

  const userName = session?.user?.name?.split(' ')[0] || 'Comprador'

  useEffect(() => {
    const uid = session?.user?.id
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
      const reviewedOrderIds = new Set(userReviews.map((r: { orderId?: string }) => r.orderId))

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

  // Auto-show buyer tutorial for first-time / new users (support request: new users go through tutorial)
  // Respects global admin toggle from PlatformConfig.tutorialsEnabled
  useEffect(() => {
    const uid = session?.user?.id
    if (uid && !loading && platformConfig?.tutorialsEnabled !== false && shouldAutoShowTutorial()) {
      const seenKey = `tutorial_buyer_${uid}`
      if (!localStorage.getItem(seenKey)) {
        const t = setTimeout(() => setShowTutorial(true), 900)
        return () => clearTimeout(t)
      }
    }
  }, [session, loading, platformConfig?.tutorialsEnabled])

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
    <div className="relative min-h-screen bg-background py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-orange-50/80 via-background to-slate-50 dark:from-orange-950/25 dark:via-background dark:to-slate-950"
      />
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Hola, {userName}</h1>
            <p className="text-muted-foreground mt-2">¿Qué servicio necesitas hoy en Colombia?</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard icon={Package} iconColor="text-orange-400" label="Pedidos realizados" value={stats.orders} />
          <StatCard icon={RefreshCw} iconColor="text-blue-400" label="En progreso" value={stats.inProgress} />
          <StatCard icon={CheckCircle} iconColor="text-emerald-400" label="Completados" value={stats.completed} />
          <StatCard icon={Star} iconColor="text-amber-400" label="Reseñas pendientes" value={stats.pendingReviews} highlight={stats.pendingReviews > 0} />
        </div>

        {/* Main CTA + search */}
        <Card className="mb-10 bg-gradient-to-br from-orange-600 to-orange-700 text-white overflow-hidden">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-white/15">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Encuentra el servicio perfecto</h2>
            <p className="text-base mb-6 max-w-2xl mx-auto text-white/90">
              Miles de gigs locales en Colombia. Busca por servicio o ciudad y encuentra freelancers confiables.
            </p>
            <div className="max-w-2xl mx-auto mb-6 text-left">
              <MegaSearchBar variant="hero" defaultCity="" className="[&_input]:border-white/20" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" id="tutorial-browse-all-gigs" className="bg-card text-brand hover:bg-muted text-base px-8 py-3 rounded-xl font-semibold shadow-lg">
                <Link href="/gigs">Ver Todos los Gigs</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white text-base px-8 py-3 rounded-xl font-semibold">
                <Link href="/messages">Mis Mensajes</Link>
              </Button>
            </div>
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
          <div id="tutorial-recent-orders" className="mb-12">
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
          <Card className="hover:shadow-md transition">
            <CardContent className="p-6 sm:p-8">
              <MessageCircle className="h-8 w-8 text-emerald-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Chats Activos</h3>
              <p className="text-muted-foreground mb-6 text-sm">Habla directamente con los vendedores</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/orders">Ir a Mis Chats</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition">
            <CardContent className="p-6 sm:p-8">
              <Package className="h-8 w-8 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Todos tus pedidos</h3>
              <p className="text-muted-foreground mb-6 text-sm">Historial completo y seguimiento</p>
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

      {/* Full onboarding tutorial modal for new users */}
      {showTutorial && (
        <OnboardingTutorial
          mode="buyer"
          onComplete={() => {
            const uid = session?.user?.id
            if (uid) markTutorialDismissed('buyer', uid)
            setShowTutorial(false)
          }}
          onClose={() => {
            const uid = session?.user?.id
            if (uid) markTutorialDismissed('buyer', uid)
            setShowTutorial(false)
          }}
        />
      )}
    </div>
  )
}
