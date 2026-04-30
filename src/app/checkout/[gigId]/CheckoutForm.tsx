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
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [status, setStatus] = useState('⏳ Cargando Wompi...');

  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;

  useEffect(() => {
    if (!publicKey) {
      setStatus('❌ Clave pública de Wompi no configurada');
      return;
    }

    if (window.WompiCheckout) {
      setScriptLoaded(true);
      setStatus('✅ Listo para pagar');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
      setStatus('✅ Listo para pagar - haz clic en el botón');
    };
    script.onerror = () => setStatus('❌ Error al cargar Wompi');
    document.body.appendChild(script);
  }, [publicKey]);

  const handlePayment = async () => {
    if (!publicKey) {
      toast.error('Falta configurar Wompi en Vercel');
      return;
    }
    if (!scriptLoaded) {
      toast.error('Espera unos segundos más...');
      return;
    }

    setLoading(true);
    setStatus('Creando orden...');

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

      const orderId = data.id || data.orderId;

      // Open Wompi
      const checkout = new window.WompiCheckout({
        publicKey,
        currency: 'COP',
        amountInCents: Math.round(gig.price * 100),
        reference: `order_${orderId}`,
        redirectUrl: `${window.location.origin}/orders/${orderId}`,
        onSuccess: () => {
          toast.success('¡Pago exitoso!');
          setTimeout(() => router.push(`/orders/${orderId}`), 1500);
        },
        onError: () => toast.error('Error en el pago'),
      });

      checkout.open();

    } catch (err: any) {
      toast.error(err.message || 'Error al procesar');
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
                ${gig.price.toLocaleString("es-CO")} COP
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
          disabled={loading || !scriptLoaded}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-5 rounded-2xl text-xl transition-all"
        >
          {loading ? 'Procesando...' : 'Pagar con Wompi 💳'}
        </button>

        <p className="text-center text-sm mt-6 text-zinc-700 font-medium">{status}</p>
      </div>
    </div>
  );
}
