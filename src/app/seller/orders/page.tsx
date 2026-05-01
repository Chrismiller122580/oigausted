'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { MessageCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function SellerOrdersPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      setLoading(false);
      return;
    }

    fetch('/api/orders?role=seller')
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl">Cargando pedidos entrantes...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-5xl font-bold">Pedidos Recibidos</h1>
          <p className="text-xl text-gray-600 mt-2">Gestiona los servicios que te han solicitado</p>
        </div>
        <Link href="/seller" className="text-orange-600 hover:underline">← Volver al Dashboard</Link>
      </div>

      {orders.length === 0 ? (
        <Card className="p-16 text-center">
          <Package className="w-20 h-20 mx-auto text-gray-300 mb-6" />
          <h3 className="text-2xl font-semibold mb-3">Aún no tienes pedidos</h3>
          <p className="text-gray-600">Cuando un comprador contrate tu servicio aparecerá aquí</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden hover:shadow-lg transition">
              <CardContent className="p-8 flex flex-col md:flex-row gap-8">
                <div className="md:w-48 flex-shrink-0">
                  {order.gig?.imageUrl ? (
                    <img src={order.gig.imageUrl} className="w-full h-40 object-cover rounded-2xl" alt={order.gig.title} />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 rounded-2xl flex items-center justify-center text-4xl">📸</div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-2xl">{order.gig?.title}</h3>
                      <p className="text-gray-600 mt-1">Cliente: {order.buyer?.name}</p>
                    </div>
                    <span className={`px-5 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="mt-6 flex gap-8 text-sm">
                    <div>
                      <p className="text-gray-500">Valor</p>
                      <p className="font-semibold">${Number(order.price || 0).toLocaleString('es-CO')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Fecha</p>
                      <p>{new Date(order.createdAt).toLocaleDateString('es-CO')}</p>
                    </div>
                  </div>

                  {order.customFields && Object.keys(order.customFields).length > 0 && (
                    <div className="mt-6 bg-orange-50 p-5 rounded-2xl">
                      <p className="font-medium mb-3 text-orange-800">Requisitos del cliente:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        {Object.entries(order.customFields).map(([key, val]) => (
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
                  <Link href={`/orders/${order.id}`}>
                    <Button className="w-full">Ver Detalles</Button>
                  </Link>
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                    <MessageCircle size={18} /> Chatear
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
