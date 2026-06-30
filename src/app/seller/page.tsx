'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import MapsPollutionNuke from '@/components/maps/MapsPollutionNuke';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Package, Star, Plus, TrendingUp, Users, Link2, Sparkles } from 'lucide-react';
import OnboardingTutorial from '@/components/common/OnboardingTutorial';
import { usePlatformConfig } from '@/components/providers/PlatformConfigProvider';
import { getOrderStatusDisplayEs, OrderStatusLabel } from '@/lib/order-status';

export default function SellerDashboard() {
  const { data: session } = useSession();
  const { config: platformConfig } = usePlatformConfig();
  const [gigs, setGigs] = useState<Array<{ id: string; title: string; price: number; isActive?: boolean; stats?: { orderCount?: number; completedCount?: number; completedRevenue?: number } }>>([]);
  const [orders, setOrders] = useState<import('@/types/order').OrderDetail[]>([]);
  const [reviews, setReviews] = useState<import('@/types/order').OrderReview[]>([]);
  const [loading, setLoading] = useState(true);

  // Tutorial state: auto appears for new sellers and when buyer->seller role unlock (full training on new features)
  const [showTutorial, setShowTutorial] = useState(false);

  const fetchData = async () => {
    try {
      const sellerId = session?.user?.id;
      const [gigsRes, ordersRes, reviewsRes] = await Promise.all([
        fetch('/api/seller/gigs'),
        fetch('/api/orders?role=seller'),
        sellerId ? fetch(`/api/reviews?sellerId=${sellerId}&limit=3`).then(r => r.json()).catch(() => ({ reviews: [] })) : Promise.resolve({ reviews: [] })
      ]);

      const gigsData = await gigsRes.json();
      const ordersData = await ordersRes.json();
      const reviewsData = await reviewsRes;

      setGigs(Array.isArray(gigsData) ? gigsData : gigsData?.gigs || []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setReviews(reviewsData.reviews || []);
    } catch (error) {
      console.error('Error fetching seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  // Auto-launch seller tutorial for new users or freshly unlocked sellers (localStorage per user+role)
  // Respects global admin toggle from PlatformConfig.tutorialsEnabled (buyer->seller unlock will re-trigger when enabled)
  useEffect(() => {
    const uid = session?.user?.id;
    if (uid && !loading && platformConfig?.tutorialsEnabled !== false) {
      const seenKey = `tutorial_seller_${uid}`;
      if (!localStorage.getItem(seenKey)) {
        const t = setTimeout(() => setShowTutorial(true), 1100);
        return () => clearTimeout(t);
      }
    }
  }, [session, loading, platformConfig?.tutorialsEnabled]);

  const paidAwaitingStart = orders.filter((o) => o.status === OrderStatusLabel.Paid);
  const activeSellerStatuses = new Set<string>([
    OrderStatusLabel.Pending,
    OrderStatusLabel.Paid,
    OrderStatusLabel.InProgress,
  ]);
  const activeOrders = orders.filter((o) => activeSellerStatuses.has(o.status ?? ''));
  const completedOrders = orders.filter(o => o.status === OrderStatusLabel.Completed);
  const totalEarnings = completedOrders.reduce((sum, order) => sum + (Number(order.price) || 0), 0);
  const pendingEarnings = activeOrders.reduce((sum, order) => sum + (Number(order.price) || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background py-8">
      <MapsPollutionNuke />
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 md:mb-10">
          <div>
            <h1 className="text-5xl font-bold text-foreground">Mi Dashboard</h1>
            <p className="text-xl text-muted-foreground mt-2">Hola, {session?.user?.name?.split(" ")[0] || 'Vendedor'}</p>
            <Link href="/seller/profile" className="text-sm text-orange-600 hover:underline inline-block mt-1">
              Editar Mi Negocio →
            </Link>
          </div>

          {/* Prominent public profile card on main dashboard */}
          <Card id="tutorial-public-profile" className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/40 border-orange-200 dark:border-orange-900/60">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-orange-600 font-semibold mb-2">
                <Link2 size={18} /> Tu perfil público directo
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Comparte este enlace para que los clientes te encuentren sin intermediarios.
              </p>
              <Link href="/seller/profile">
                <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                  Ver y compartir mi enlace público
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/30 border-rose-200 dark:border-rose-900/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-semibold mb-2">
                <Sparkles size={18} /> Marketing IA
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Genera posts para Instagram y WhatsApp con tu tienda OigaGig y descargas con marca.
              </p>
              <Link href="/seller/marketing">
                <Button size="sm" variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-950/50">
                  Abrir Estudio de Marketing
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 border-blue-200 dark:border-blue-900/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold mb-2">
                <Users size={18} /> Red de Vendedores
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Busca socios para proyectos grandes. Combina servicios y contacta otros vendedores.
              </p>
              <Link href="/seller/network">
                <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-950/50">
                  Explorar red de vendedores
                </Button>
              </Link>
            </CardContent>
          </Card>
          {/* Center the CTA on mobile so it aligns with the stacked stat tiles */}
          <div className="flex justify-center md:justify-end">
            <Link href="/create-gig">
              <Button id="tutorial-create-gig" className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-6 rounded-2xl flex items-center gap-3">
                <Plus size={24} /> Crear Nuevo Gig
              </Button>
            </Link>
          </div>
        </div>

        {paidAwaitingStart.length > 0 && (
          <Card className="mb-8 border-2 border-blue-300 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-800">
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-semibold text-blue-800 dark:text-blue-300 text-lg">
                  {paidAwaitingStart.length === 1
                    ? 'Tienes 1 pedido pagado listo para iniciar'
                    : `Tienes ${paidAwaitingStart.length} pedidos pagados listos para iniciar`}
                </p>
                <p className="text-sm text-blue-700/80 dark:text-blue-400/80 mt-1">
                  El comprador ya pagó. Acepta el pedido y comienza el trabajo.
                </p>
              </div>
              <Link href="/seller/orders">
                <Button className="bg-blue-600 hover:bg-blue-700 shrink-0">Ver pedidos pagados</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardContent className="p-8">
              <DollarSign className="w-12 h-12 text-green-600 mb-4" />
              <p className="text-sm text-muted-foreground">Ganancias Totales</p>
              <p className="text-4xl font-bold mt-2 text-foreground">${totalEarnings.toLocaleString('es-CO')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <Package className="w-12 h-12 text-orange-600 mb-4" />
              <p className="text-sm text-muted-foreground">Gigs Publicados</p>
              <p className="text-4xl font-bold mt-2 text-foreground">{gigs.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <TrendingUp className="w-12 h-12 text-blue-600 mb-4" />
              <p className="text-sm text-muted-foreground">Pedidos Activos</p>
              <p className="text-4xl font-bold mt-2 text-foreground">{activeOrders.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <Star className="w-12 h-12 text-amber-500 mb-4" />
              <p className="text-sm text-muted-foreground">Calificación</p>
              <p className="text-4xl font-bold mt-2 text-foreground">
                {session?.user?.rating?.toFixed(1) || "—"} ★
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {session?.user?.reviewCount || 0} reseñas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reviews for Seller */}
        <Card className="mb-8">
          <CardContent className="p-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-foreground">Reseñas Recientes</h3>
              <Link href="/seller/profile">
                <Button variant="outline" size="sm">Ver todas</Button>
              </Link>
            </div>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review, idx) => (
                  <div key={idx} className="flex gap-4 p-4 border rounded-2xl">
                    <div className="flex text-lg text-yellow-500 shrink-0">
                      {[1,2,3,4,5].map(n => <span key={n}>{n <= review.rating ? "★" : "☆"}</span>)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground line-clamp-2">"{review.comment || 'Sin comentario'}"</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        — {review.reviewer?.name || 'Cliente'} {review.order?.gig?.title ? `• ${review.order.gig.title}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-4 text-center">Aún no tienes reseñas. ¡Sigue ofreciendo buenos servicios!</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Gigs - Summary */}
          <Card>
            <CardContent className="p-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-foreground">Mis Servicios</h3>
                <Link href="/seller/gigs">
                  <Button variant="outline" size="sm">Gestionar todos</Button>
                </Link>
              </div>

              {gigs.length > 0 ? (
                <div className="space-y-4">
                  {gigs.slice(0, 3).map(gig => (
                    <Link 
                      key={gig.id} 
                      href="/seller/gigs" 
                      className="flex items-center justify-between p-4 border rounded-2xl hover:bg-muted/50 transition group"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate text-foreground">{gig.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {gig.stats?.orderCount || 0} pedidos • ${((gig.stats?.completedRevenue || 0) / 1000).toFixed(0)}k ganados
                        </p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${gig.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                        {gig.isActive ? 'Activo' : 'Pausado'}
                      </span>
                    </Link>
                  ))}
                  {gigs.length > 3 && (
                    <p className="text-center text-sm text-muted-foreground pt-2">
                      +{gigs.length - 3} más
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">Aún no tienes gigs publicados.</p>
                  <Link href="/create-gig">
                    <Button size="sm">Crear mi primer servicio</Button>
                  </Link>
                </div>
              )}

              <div className="mt-6 pt-6 border-t text-center">
                <Link href="/seller/gigs" className="text-sm text-orange-600 hover:underline">
                  Ver y gestionar todos mis servicios →
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Active Orders */}
          <Card>
            <CardContent className="p-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-foreground">Pedidos Activos</h3>
                <Link href="/seller/orders">
                  <Button variant="outline" size="sm">Ver Todos</Button>
                </Link>
              </div>
              {activeOrders.length > 0 ? (
                <div className="space-y-3">
                  {activeOrders.slice(0, 4).map(order => (
                    <div
                      key={order.id}
                      className={`flex justify-between items-center p-4 border rounded-2xl hover:bg-muted/50 transition ${
                        order.status === OrderStatusLabel.Paid ? 'border-blue-300 bg-blue-50/50 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate text-foreground">{order.gig?.title || "Servicio"}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.buyer?.name || "Cliente"} • ${Number(order.price || 0).toLocaleString('es-CO')}
                        </p>
                        <p className={`text-xs mt-0.5 font-medium ${
                          order.status === OrderStatusLabel.Paid
                            ? 'text-blue-700 dark:text-blue-400'
                            : 'text-orange-600'
                        }`}>
                          {getOrderStatusDisplayEs(order.status)}
                          {order.status === OrderStatusLabel.Paid ? ' — ¡inicia el trabajo!' : ''}
                        </p>
                      </div>
                      <Link href={`/orders/${order.id}`}>
                        <Button
                          variant={order.status === OrderStatusLabel.Paid ? 'default' : 'outline'}
                          size="sm"
                          className={`shrink-0 ${order.status === OrderStatusLabel.Paid ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                        >
                          {order.status === OrderStatusLabel.Paid ? 'Iniciar' : 'Gestionar'}
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground py-12 text-center">No tienes pedidos activos en este momento.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seller tutorial modal - shows on first seller visit and re-appears after buyer->seller promotion */}
      {showTutorial && (
        <OnboardingTutorial
          mode="seller"
          onComplete={() => {
            const uid = session?.user?.id;
            if (uid) localStorage.setItem(`tutorial_seller_${uid}`, 'true');
            setShowTutorial(false);
          }}
          onClose={() => setShowTutorial(false)}
        />
      )}
    </div>
  );
}
