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
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Wompi script dynamically
  useEffect(() => {
    if (window.WompiCheckout) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => toast.error('No se pudo cargar Wompi');
    document.body.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleWompiPayment = async () => {
    if (!scriptLoaded) {
      toast.error('Wompi aún no está listo. Intenta de nuevo en unos segundos.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: gig.id,
          buyerId: buyerId,
          price: gig.price
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) throw new Error(orderData.error || 'Error al crear la orden');

      const orderId = orderData.id || orderData.orderId;

      // 2. Open Wompi widget
      const checkout = new window.WompiCheckout({
        publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
        currency: 'COP',
        amountInCents: Math.round(gig.price * 100),
        reference: `order_${orderId}`,
        redirectUrl: `${window.location.origin}/orders/${orderId}`,
        onSuccess: (transaction: any) => {
          toast.success('¡Pago exitoso!');
          setTimeout(() => router.push(`/orders/${orderId}`), 1200);
        },
        onError: (error: any) => {
          toast.error('Error en el pago. Inténtalo nuevamente.');
          console.error(error);
        },
      });

      checkout.open();

    } catch (err: any) {
      toast.error(err.message || 'Error al procesar el pago');
      console.error(err);
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
          <p className="text-zinc-600 mt-3 line-clamp-3">{gig.description}</p>
          
          <div className="mt-8 flex justify-between items-end">
            <div>
              <p className="text-sm text-zinc-500">Precio total</p>
              <p className="text-4xl font-bold text-orange-600">
                ${gig.price.toLocaleString("es-CO")} COP
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-500">Vendedor</p>
              <p className="font-medium">{gig.seller?.businessName || gig.seller?.name || "Vendedor"}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleWompiPayment}
          disabled={loading || !scriptLoaded}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-5 rounded-2xl text-xl transition-all flex items-center justify-center gap-3"
        >
          {loading ? 'Procesando...' : 'Pagar con Wompi 💳'}
        </button>

        <p className="text-center text-xs text-zinc-500 mt-8">
          Pago seguro procesado por Wompi • Dinero protegido hasta que apruebes el servicio
        </p>
      </div>
    </div>
  );
}
