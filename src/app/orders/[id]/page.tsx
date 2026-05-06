'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    fetch(`/api/orders/${orderId}`)
      .then(res => res.json())
      .then(data => {
        console.log("📦 Raw API response:", data);
        
        // Handle both possible formats
        const order = data.order || data;
        setOrderData(order);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [orderId]);

  if (loading) return <div className="p-20 text-center text-2xl">Cargando pedido...</div>;
  if (!orderData) return <div className="p-20 text-center text-red-600">Pedido no encontrado</div>;

  const price = Number(orderData.price || 0);
  const gig = orderData.gig || {};

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">
          Pedido <span className="text-orange-600">#{orderData.id}</span>
        </h1>
        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          {orderData.status || 'Pendiente'}
        </span>
      </div>

      <div className="grid gap-6">
        <div className="bg-white border rounded-3xl p-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-semibold">{gig.title || 'Servicio'}</h2>
              <p className="text-gray-600 mt-3">{gig.description}</p>
            </div>
            <div className="text-right">
              <p className="text-6xl font-bold text-orange-600">
                ${price.toLocaleString('es-CO')} COP
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-3xl p-8">
          <p className="font-medium mb-3">Progreso del Pedido</p>
          <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
            <div className="bg-black h-3 w-1/3 rounded-full"></div>
          </div>
        </div>

        <div className="bg-white border rounded-3xl p-8">
          <h3 className="font-semibold mb-4">💬 Chat del Pedido</h3>
          <div className="h-96 bg-gray-50 rounded-2xl border flex items-center justify-center">
            <p className="text-gray-500">Chat persistente con el vendedor (en desarrollo)</p>
          </div>
        </div>
      </div>
    </div>
  );
}