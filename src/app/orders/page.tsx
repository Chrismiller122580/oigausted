'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { MessageCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function BuyerOrdersPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const userId = session.user.id;

    Promise.all([
      fetch('/api/orders?role=buyer').then(res => res.json()),
      fetch(`/api/reviews?reviewerId=${userId}&limit=100`).then(res => res.json()).catch(() => ({ reviews: [] }))
    ])
    .then(([ordersData, reviewsData]) => {
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setReviews(reviewsData.reviews || []);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, [session, status]);

  // Orders that are completed but have no review yet
  const reviewedOrderIds = new Set(reviews.map(r => r.orderId));
  const needsReview = (order: any) =>
    order.status === 'Completed' && !reviewedOrderIds.has(order.id);

  const getProgress = (status: string) => {
    switch (status) {
      case 'Pending': return 25;
      case 'Paid': return 50;
      case 'In Progress': return 75;
      case 'Completed': return 100;
      default: return 25;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'text-yellow-700';
      case 'Paid': return 'text-blue-700';
      case 'In Progress': return 'text-purple-700';
      case 'Completed': return 'text-green-700';
      case 'Cancelled': return 'text-red-700';
      default: return 'text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando tus pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-5xl font-bold">Mis Pedidos</h1>
          <p className="text-xl text-gray-600 mt-2">Seguimiento en tiempo real</p>
        </div>
        <Link href="/gigs" className="text-orange-600 hover:underline flex items-center gap-2">
          Explorar más gigs →
        </Link>
      </div>

      {orders.length === 0 ? (
        <Card className="p-16 text-center">
          <Package className="w-20 h-20 mx-auto text-gray-300 mb-6" />
          <h3 className="text-2xl font-semibold mb-3">Aún no tienes pedidos</h3>
          <p className="text-gray-600 mb-8">Cuando contrates un servicio aparecerá aquí</p>
          <Button asChild size="lg">
            <Link href="/gigs">Explorar Gigs</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => {
            const progress = getProgress(order.status);
            return (
              <Card key={order.id} className="overflow-hidden hover:shadow-lg transition">
                <CardContent className="p-8 flex flex-col md:flex-row gap-8">
                  <div className="md:w-48 flex-shrink-0">
                    {order.gig?.imageUrl ? (
                      <img src={order.gig.imageUrl} className="w-full h-40 object-cover rounded-2xl" alt={order.gig.title} />
                    ) : (
                      <div className="w-full h-40 bg-gray-100 rounded-2xl flex items-center justify-center text-4xl">📸</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-2xl line-clamp-2">{order.gig?.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-5 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        {needsReview(order) && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            Reseña pendiente
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-600 mt-1">Proveedor: {order.seller?.businessName || order.seller?.name}</p>

                    <div className="mt-6">
                      <Progress value={progress} className="h-3" />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Pendiente</span>
                        <span>En Progreso</span>
                        <span>Completado</span>
                      </div>
                    </div>

                    {/* Custom Requirements Summary */}
                    {order.customFields && Object.keys(order.customFields).length > 0 && (
                      <div className="mt-6 bg-gray-50 p-5 rounded-2xl text-sm">
                        <p className="font-medium mb-3">Tus requisitos:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                          {Object.entries(order.customFields).slice(0, 4).map(([key, val]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="font-medium">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 w-full md:w-52 pt-4">
                    {needsReview(order) ? (
                      <Link href={`/orders/${order.id}?tab=review`}>
                        <Button className="w-full bg-orange-600 hover:bg-orange-700">
                          Dejar reseña
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/orders/${order.id}`}>
                        <Button className="w-full">Ver Detalles</Button>
                      </Link>
                    )}
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2" asChild>
                      <Link href={`/orders/${order.id}`}>
                        <MessageCircle size={18} /> Chatear
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
