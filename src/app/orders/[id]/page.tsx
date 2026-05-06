'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    fetch(`/api/orders/${orderId}`)
      .then(res => res.json())
      .then(data => {
        console.log("🔥 FRESH BUILD - Order data:", data);
        setOrder(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [orderId]);

  if (loading) return <div className="p-20 text-center text-3xl">🔄 Cargando pedido...</div>;
  if (!order) return <div className="p-20 text-center text-red-600 text-2xl">Pedido no encontrado</div>;

  const price = Number(order.price || order.amount || 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-orange-600">🎉 TEST BUILD SUCCESSFUL</h1>
        <p className="text-2xl mt-4">Pedido <span className="font-mono">#{order.id}</span></p>
      </div>

      <div className="bg-white border-2 border-orange-500 rounded-3xl p-10">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">{order.gig?.title || 'Servicio'}</h2>
            <p className="text-gray-600 mt-3">{order.gig?.description}</p>
          </div>
          <div className="text-right">
            <p className="text-6xl font-bold text-orange-600">
              ${price.toLocaleString('es-CO')} COP
            </p>
          </div>
        </div>
      </div>

      <p className="text-center mt-8 text-green-600 font-medium">
        If you see this big orange price and order number → cache is broken successfully
      </p>
    </div>
  );
}
