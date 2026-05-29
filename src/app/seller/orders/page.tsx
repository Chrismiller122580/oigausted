'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { MessageCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { parseCustomFields } from '@/lib/utils';

export default function SellerOrdersPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const sellerId = session.user.id;

    Promise.all([
      fetch('/api/orders?role=seller').then(res => res.json()),
      fetch(`/api/reviews?sellerId=${sellerId}&limit=100`).then(res => res.json()).catch(() => ({ reviews: [] }))
    ])
    .then(([ordersData, reviewsData]) => {
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setReviews(reviewsData.reviews || []);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, [session, status]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Paid': return 'bg-blue-100 text-blue-700';
      case 'In Progress': return 'bg-purple-100 text-purple-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const reviewedOrderIds = new Set(reviews.map(r => r.orderId));

  const hasReview = (orderId: string) => reviewedOrderIds.has(orderId);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Error actualizando estado');

      // Refresh the list
      const updatedOrders = orders.map(o =>
        o.id === orderId ? { ...o, status: newStatus } : o
      );
      setOrders(updatedOrders);

      toast.success(`Pedido actualizado a: ${newStatus}`);
    } catch (error) {
      toast.error('No se pudo actualizar el estado');
    }
  };

  const filteredOrders = statusFilter === 'All' 
    ? orders 
    : orders.filter(o => o.status === statusFilter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Cargando pedidos entrantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-6xl mx-auto px-6">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-5xl font-bold text-foreground">Pedidos Recibidos</h1>
          <p className="text-xl text-muted-foreground mt-2">Gestiona los servicios que te han solicitado</p>
        </div>
        <Link href="/seller" className="text-orange-600 hover:underline">← Volver al Dashboard</Link>
      </div>

      {/* Status Filters */}
      {orders.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {['All', 'Pending', 'In Progress', 'Completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                statusFilter === status 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {status === 'All' ? 'Todos' : status}
            </button>
          ))}
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <Card className="p-16 text-center">
          <Package className="w-20 h-20 mx-auto text-muted-foreground mb-6" />
          <h3 className="text-2xl font-semibold mb-3 text-foreground">Aún no tienes pedidos</h3>
          <p className="text-muted-foreground">Cuando un comprador contrate tu servicio aparecerá aquí</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden hover:shadow-lg transition">
              <CardContent className="p-8 flex flex-col md:flex-row gap-8">
                <div className="md:w-48 flex-shrink-0">
                  {order.gig?.imageUrl ? (
                    <img src={order.gig.imageUrl} className="w-full h-40 object-cover rounded-2xl" alt={order.gig.title} />
                  ) : (
                    <div className="w-full h-40 bg-muted rounded-2xl flex items-center justify-center text-4xl">📸</div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-2xl text-foreground">{order.gig?.title}</h3>
                      <p className="text-muted-foreground mt-1">Cliente: {order.buyer?.name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-5 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      {order.status === 'Completed' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${hasReview(order.id) ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {hasReview(order.id) ? 'Reseña recibida' : 'Sin reseña'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex gap-8 text-sm">
                    <div>
                      <p className="text-muted-foreground">Valor</p>
                      <p className="font-semibold text-foreground">${Number(order.price || 0).toLocaleString('es-CO')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fecha</p>
                      <p className="text-foreground">{new Date(order.createdAt).toLocaleDateString('es-CO')}</p>
                    </div>
                  </div>

                  {Object.keys(parseCustomFields(order.customFields)).length > 0 && (
                    <div className="mt-6 bg-orange-50 dark:bg-orange-950/40 p-5 rounded-2xl">
                      <p className="font-medium mb-3 text-orange-800 dark:text-orange-400">Requisitos del cliente:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        {Object.entries(parseCustomFields(order.customFields)).map(([key, val]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-orange-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="font-medium">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 w-full md:w-52 pt-4">
                  {/* Quick Status Actions */}
                  {order.status === 'Pending' && (
                    <>
                      <Button 
                        onClick={() => updateOrderStatus(order.id, 'In Progress')}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        Aceptar y Comenzar
                      </Button>
                      <Button 
                        onClick={() => updateOrderStatus(order.id, 'Cancelled')}
                        variant="outline"
                        className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Cancelar Pedido
                      </Button>
                    </>
                  )}

                  {order.status === 'In Progress' && (
                    <Button 
                      onClick={() => updateOrderStatus(order.id, 'Completed')}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Marcar como Completado
                    </Button>
                  )}

                  <Link href={`/orders/${order.id}`}>
                    <Button variant="outline" className="w-full">Ver Detalles</Button>
                  </Link>
                  <Link href={`/orders/${order.id}`}>
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                      <MessageCircle size={18} /> Chatear
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
