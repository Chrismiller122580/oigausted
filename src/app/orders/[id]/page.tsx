'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, ArrowLeft } from 'lucide-react';

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Orden no encontrada');
        return;
      }

      setOrder(data);
    } catch (err) {
      setError('Error cargando el pedido');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando pedido...</div>;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error || 'Pedido no encontrado'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-6">
        <Link href="/orders" className="flex items-center gap-2 text-orange-600 mb-8 hover:underline">
          ← Volver a Mis Pedidos
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardContent className="p-10">
                <h1 className="text-3xl font-bold">{order.gig?.title || 'Pedido sin título'}</h1>
                <p className="text-4xl font-bold text-orange-600 mt-4">
                  ${Number(order.price || 0).toLocaleString('es-CO')}
                </p>
                <p className="text-sm text-zinc-500 mt-2">
                  ID: {order.id}
                </p>
              </CardContent>
            </Card>

            {/* Chat Section */}
            <Card>
              <CardContent className="p-8">
                <h3 className="font-semibold text-xl mb-6 flex items-center gap-3">
                  <MessageCircle className="w-6 h-6" /> Chat con el cliente
                </h3>
                <div className="h-96 bg-gray-50 rounded-2xl p-6 overflow-y-auto space-y-4 mb-6">
                  <div className="flex justify-start">
                    <div className="max-w-[75%] bg-white border px-5 py-3 rounded-3xl">
                      Hola, ¿cuándo puedes empezar?<br />
                      <span className="text-xs text-gray-500">hace 2 horas</span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[75%] bg-orange-600 text-white px-5 py-3 rounded-3xl">
                      Mañana en la mañana estoy disponible<br />
                      <span className="text-xs opacity-75">hace 1 hora</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    className="flex-1 border rounded-2xl px-5 py-4"
                    placeholder="Escribe un mensaje..."
                  />
                  <button className="bg-orange-600 text-white px-8 rounded-2xl">Enviar</button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="sticky top-8">
              <CardContent className="p-8">
                <h3 className="font-semibold mb-6">Estado del Pedido</h3>
                <div className="space-y-6 text-sm">
                  <div className="flex justify-between">
                    <span>Estado actual</span>
                    <span className="font-medium text-green-600">En Progreso</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entrega estimada</span>
                    <span>5 días</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
