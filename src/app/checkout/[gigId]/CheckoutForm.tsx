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
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    console.log('🔍 CheckoutForm mounted - Public Key:', process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ? '✅ Present' : '❌ MISSING');

    if (window.WompiCheckout) {
      console.log('✅ Wompi already loaded');
      setScriptLoaded(true);
      return;
    }

    console.log('📥 Loading Wompi script...');
    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Wompi script loaded successfully');
      setScriptLoaded(true);
      setDebugInfo('Wompi listo');
    };
    script.onerror = () => {
      console.error('❌ Failed to load Wompi script');
      toast.error('No se pudo cargar Wompi');
    };
    document.body.appendChild(script);
  }, []);

  const handleWompiPayment = async () => {
    console.log('🟡 Button clicked');

    if (!process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY) {
      toast.error('Falta la clave pública de Wompi');
      console.error('❌ NEXT_PUBLIC_WOMPI_PUBLIC_KEY is missing');
      return;
    }

    if (!scriptLoaded || !window.WompiCheckout) {
      toast.error('Wompi aún se está cargando... espera 2 segundos');
      console.warn('⚠️ Wompi not ready yet');
      return;
    }

    setLoading(true);
    console.log('🚀 Creating order...');

    try {
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
      console.log('📦 Order response:', orderData);

      if (!orderRes.ok) throw new Error(orderData.error || 'Error creando orden');

      const orderId = orderData.id || orderData.orderId;
      console.log('✅ Order created:', orderId);

      // Open Wompi
      console.log('💳 Opening Wompi widget...');
      const checkout = new window.WompiCheckout({
        publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
        currency: 'COP',
        amountInCents: Math.round(gig.price * 100),
        reference: `order_${orderId}`,
        redirectUrl: `${window.location.origin}/orders/${orderId}`,
        onSuccess: () => {
          toast.success('¡Pago exitoso!');
          setTimeout(() => router.push(`/orders/${orderId}`), 1500);
        },
        onError: (error: any) => {
          toast.error('Error en el pago');
          console.error('Wompi error:', error);
        },
      });

      checkout.open();

    } catch (err: any) {
      console.error('💥 Checkout error:', err);
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
          onClick={handleWompiPayment}
          disabled={loading || !scriptLoaded}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-5 rounded-2xl text-xl transition-all flex items-center justify-center gap-3"
        >
          {loading ? 'Procesando...' : 'Pagar con Wompi 💳'}
        </button>

        {debugInfo && <p className="text-center text-xs text-green-600 mt-4">{debugInfo}</p>}

        <p className="text-center text-xs text-zinc-500 mt-8">
          Pago seguro procesado por Wompi • Dinero protegido
        </p>
      </div>
    </div>
  );
}
