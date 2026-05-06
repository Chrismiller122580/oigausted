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
        const orderData = data.order || data;
        console.log("✅ Order loaded:", orderData);
        setOrder(orderData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [orderId]);

  if (loading) return <div className="p-20 text-center text-2xl">Cargando pedido...</div>;
  if (!order) return <div className="p-20 text-center text-red-600">Pedido no encontrado</div>;

  const price = Number(order.price || order.amount || 0);
  const gig = order.gig || {};
  const isCompleted = order.status === 'Completed';

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Pedido <span className="text-orange-600">#{order.id}</span></h1>
          <p className="text-gray-500 mt-1">Creado el {new Date(order.createdAt).toLocaleDateString('es-CO')}</p>
        </div>
        <span className={`px-5 py-2 rounded-full text-sm font-medium ${
          isCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {isCompleted ? '✅ Completado' : '⏳ En progreso'}
        </span>
      </div>

      <div className="grid gap-6">
        {/* Main Service Card */}
        <div className="bg-white border rounded-3xl p-8 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-3xl font-bold">{gig.title}</h2>
              <p className="text-gray-600 mt-3 leading-relaxed">{gig.description}</p>
            </div>
            <div className="text-right ml-8">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-5xl font-bold text-orange-600 mt-1">
                ${price.toLocaleString('es-CO')} COP
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white border rounded-3xl p-8">
          <div className="flex justify-between mb-4">
            <p className="font-semibold">Progreso del Pedido</p>
            <span className="text-sm text-gray-500">{isCompleted ? '100%' : '33%'}</span>
          </div>
          <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden">
            <div className={`h-4 rounded-full transition-all ${isCompleted ? 'bg-green-500 w-full' : 'bg-orange-500 w-1/3'}`}></div>
          </div>
        </div>

        {/* Seller Info */}
        <div className="bg-white border rounded-3xl p-8">
          <h3 className="font-semibold mb-4">Vendedor</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <p className="font-medium">{order.seller?.businessName || order.seller?.name || 'Vendedor'}</p>
              <p className="text-sm text-gray-500">Miembro desde hace tiempo</p>
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="bg-white border rounded-3xl p-8">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            💬 Chat del Pedido
          </h3>
          <div className="h-96 bg-gray-50 rounded-2xl border p-6 overflow-y-auto">
            <div className="text-center text-gray-500 py-12">
              💬 El chat con el vendedor aparecerá aquí una vez iniciado el servicio
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <input 
              type="text" 
              placeholder="Escribe un mensaje..." 
              className="flex-1 border rounded-2xl px-5 py-3 focus:outline-none focus:border-orange-500"
              disabled 
            />
            <button className="bg-orange-600 text-white px-8 rounded-2xl" disabled>Enviar</button>
          </div>
        </div>
      </div>
    </div>
  );
}