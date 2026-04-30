'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Props {
  gig: any;
  buyerId: string;
}

export default function CheckoutForm({ gig, buyerId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [status, setStatus] = useState('⏳ Creando orden...');

  // Auto-create order
  useEffect(() => {
    const createOrder = async () => {
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gigId: gig.id, buyerId, price: gig.price }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error creando orden');

        setOrderId(data.id || data.orderId);
        setStatus('✅ Orden creada');
      } catch (err: any) {
        toast.error(err.message);
      }
    };

    if (gig?.id && buyerId) createOrder();
  }, [gig, buyerId]);

  const handleRealWompi = () => {
    toast.error('Wompi hosted checkout still blocked. Use "Simular Pago" for now.');
  };

  const handleSimulatePayment = async () => {
    if (!orderId) return;

    setLoading(true);

    try {
      // Mark order as paid
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed' }),
      });

      toast.success('✅ Pago simulado con éxito (modo desarrollo)');
      setTimeout(() => router.push(`/orders/${orderId}`), 1200);
    } catch (err) {
      toast.error('Error simulando pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="bg-white rounded-3xl border p-10">
        <h1 className="text-3xl font-bold mb-8">Confirmar Compra</h1>

        <div className="mb-10">
          <h2 className="text-2xl font-semibold">{gig.title}</h2>
          <p className="text-zinc-600 mt-3">{gig.description}</p>

          <div className="mt-8 flex justify-between items-end">
            <div>
              <p className="text-sm text-zinc-500">Precio total</p>
              <p className="text-4xl font-bold text-orange-600">
                ${Number(gig.price).toLocaleString("es-CO")} COP
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-500">Vendedor</p>
              <p className="font-medium">{gig.seller?.businessName || gig.seller?.name}</p>
            </div>
          </div>
        </div>

        {/* Real Wompi button (disabled for now) */}
        <button
          onClick={handleRealWompi}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-5 rounded-2xl text-xl transition-all mb-4"
        >
          Pagar con Wompi 💳 (real)
        </button>

        {/* Development simulation button */}
        <button
          onClick={handleSimulatePayment}
          disabled={loading || !orderId}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-5 rounded-2xl text-xl transition-all"
        >
          {loading ? 'Simulando pago...' : '🔧 Simular Pago (Modo Desarrollo)'}
        </button>

        <p className="text-center text-sm mt-6 font-medium text-zinc-700">{status}</p>
      </div>
    </div>
  );
}
