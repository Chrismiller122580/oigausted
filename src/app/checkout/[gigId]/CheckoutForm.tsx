'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Props {
  gig: any;
  buyerId: string;
}

declare global {
  interface Window {
    WompiCheckout: any;
  }
}

export default function CheckoutForm({ gig, buyerId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('⏳ Cargando Wompi...');

  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;

  useEffect(() => {
    if (!publicKey) {
      setStatus('❌ Clave Wompi no configurada en Vercel');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    script.onload = () => {
      setReady(true);
      setStatus('✅ Listo - haz clic en Pagar');
    };
    script.onerror = () => setStatus('❌ Error cargando Wompi');
    document.body.appendChild(script);
  }, [publicKey]);

  const handlePayment = async () => {
    if (!ready) {
      toast.error('Espera que Wompi termine de cargar');
      return;
    }

    setLoading(true);
    setStatus('Creando orden...');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gigId: gig.id, buyerId, price: gig.price }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error creando orden');

      const orderId = data.id || data.orderId;

      // Small delay to ensure Wompi is fully ready
      setTimeout(() => {
        try {
          const checkout = new window.WompiCheckout({
            publicKey,
            currency: 'COP',
            amountInCents: Math.round(Number(gig.price) * 100),
            reference: `order_${orderId}`,
            redirectUrl: `${window.location.origin}/orders/${orderId}`,
            onSuccess: () => {
              toast.success('¡Pago exitoso!');
              setTimeout(() => router.push(`/orders/${orderId}`), 1500);
            },
            onError: (err: any) => {
              toast.error('Error en el pago');
              console.error(err);
            },
          });

          checkout.open();
          setStatus('✅ Widget Wompi abierto');
        } catch (e) {
          console.error("Wompi open error:", e);
          toast.error("No se pudo abrir Wompi");
        }
      }, 600);

    } catch (err: any) {
      toast.error(err.message || 'Error inesperado');
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

        <button
          onClick={handlePayment}
          disabled={loading || !ready}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-5 rounded-2xl text-xl transition-all"
        >
          {loading ? 'Procesando...' : 'Pagar con Wompi 💳'}
        </button>

        <p className="text-center text-sm mt-6 font-medium text-zinc-700">{status}</p>
      </div>
    </div>
  );
}
