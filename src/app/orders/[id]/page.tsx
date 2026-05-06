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
        console.log("🔥 RAW ORDER DATA:", JSON.stringify(data, null, 2)); // Full detailed log
        setOrder(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, [orderId]);

  if (loading) return <div className="p-20 text-center text-2xl">Cargando pedido...</div>;
  if (!order) return <div className="p-20 text-center text-red-600">Pedido no encontrado</div>;

  const price = Number(order.price || order.amount || 0);
  const gigTitle = order.gig?.title || 'Servicio';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">
          Pedido <span className="text-orange-600">#{order.id}</span>
        </h1>
        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          {order.status || 'Pendiente'}
        </span>
      </div>

      <div className="bg-white border rounded-3xl p-8 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-semibold">{gigTitle}</h2>
            <p className="text-gray-600 mt-3">{order.gig?.description}</p>
          </div>
          <div className="text-right">
            <p className="text-6xl font-bold text-orange-600">
              ${price.toLocaleString('es-CO')} COP
            </p>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500">
        Check the browser console (F12) for "RAW ORDER DATA" to see what the API returns.
      </div>
    </div>
  );
}