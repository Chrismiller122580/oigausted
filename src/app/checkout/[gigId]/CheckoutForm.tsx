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

  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;

  // Auto-create order
  useEffect(() => {
    const createOrder = async () => {
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gigId: gig.id,
            buyerId,
            price: gig.price
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error creando orden');

        setOrderId(data.id || data.orderId);
        setStatus('✅ Orden creada - listo para pagar');
      } catch (err: any) {
        toast.error(err.message || 'Error al crear orden');
      }
    };

    if (gig?.id && buyerId) createOrder();
  }, [gig, buyerId]);

  const handlePay = () => {
    if (!orderId) {
      toast.error('Orden no lista aún');
      return;
    }

    setLoading(true);

    const amountInCents = Math.round(Number(gig.price) * 100);
    const redirectUrl = `${window.location.origin}/orders/${orderId}`;

    // Clean Wompi redirect URL
    const wompiUrl = `https://checkout.wompi.co/?public-key=${publicKey}&currency=COP&amount-in-cents=${amountInCents}&reference=order_${orderId}&redirect-url=${encodeURIComponent(redirectUrl)}`;

    window.location.href = wompiUrl;
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

        <button
          onClick={handlePay}
          disabled={loading || !orderId}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-5 rounded-2xl text-xl transition-all"
        >
          {loading ? 'Redirigiendo...' : 'Pagar con Wompi 💳'}
        </button>

        <p className="text-center text-sm mt-6 font-medium text-zinc-700">{status}</p>
      </div>
    </div>
  );
}
