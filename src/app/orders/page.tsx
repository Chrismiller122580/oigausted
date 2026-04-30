'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Clock, MessageCircle, Package, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function BuyerOrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch('/api/orders?role=buyer')
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session]);

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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl">Cargando tus pedidos...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-5xl font-bold">Mis Pedidos</h1>
          <p className="text-xl text-gray-600 mt-2">Seguimiento de todos tus servicios</p>
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
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden hover:shadow-lg transition">
              <CardContent className="p-8 flex flex-col md:flex-row gap-8">
                {/* Gig Image */}
                <div className="md:w-48 flex-shrink-0">
                  {order.gig?.imageUrl ? (
                    <img src={order.gig.imageUrl} className="w-full h-40 object-cover rounded-2xl" alt={order.gig.title} />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 rounded-2xl flex items-center justify-center">
                      📸
                    </div>
                  )}
                </div>

                {/* Main Info */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-2xl">{order.gig?.title}</h3>
                      <p className="text-gray-600 mt-1">Proveedor: {order.seller?.businessName || order.seller?.name}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="mt-6 flex items-center gap-8 text-sm">
                    <div>
                      <p className="text-gray-500">Total pagado</p>
                      <p className="font-semibold text-xl">${Number(order.price).toLocaleString('es-CO')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Fecha</p>
                      <p className="font-medium">{new Date(order.createdAt).toLocaleDateString('es-CO')}</p>
                    </div>
                  </div>

                  {/* Dynamic buyer requirements summary */}
                  {order.customFields && Object.keys(order.customFields).length > 0 && (
                    <div className="mt-6 bg-gray-50 p-4 rounded-2xl text-sm">
                      <p className="font-medium mb-2">Tus requisitos:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(order.customFields).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 capitalize">{key}:</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 md:w-52 pt-4">
                  <Link href={`/orders/${order.id}`}>
                    <Button className="w-full" variant="default">
                      Ver Detalles
                    </Button>
                  </Link>

                  <Button variant="outline" className="w-full flex items-center gap-2">
                    <MessageCircle size={18} />
                    Chatear con vendedor
                  </Button>

                  {order.status === 'Completed' && (
                    <Button variant="outline" className="w-full text-green-600">
                      Calificar servicio
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
