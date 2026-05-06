'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { data: session } = useSession();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    fetch(`/api/orders/${orderId}`)
      .then(r => r.json())
      .then(data => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderId]);

  if (loading) return <div className="p-20 text-center">Cargando pedido...</div>;
  if (!order) return <div className="p-20 text-center">Pedido no encontrado</div>;

  const price = Number(order.price || order.amount || 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Pedido #{order.id}</h1>
        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          {order.status || 'Pendiente'}
        </span>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-semibold">{order.gig?.title}</h2>
                <p className="text-gray-600 mt-2">{order.gig?.description}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-orange-600">
                  ${price.toLocaleString('es-CO')} COP
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardContent className="p-8">
            <p className="font-medium mb-3">Progreso del Pedido</p>
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
              <div className="bg-black h-3 w-1/3 rounded-full"></div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Section */}
        <Card>
          <CardContent className="p-8">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              💬 Chat del Pedido
            </h3>
            {/* Your existing chat component goes here */}
            <div className="h-96 bg-gray-50 rounded-2xl flex items-center justify-center border">
              <p className="text-gray-500">Chat persistente (próximamente)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
