'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

export default function CheckoutPage() {
  const params = useParams();
  const gigId = params.gigId as string;
  const router = useRouter();
  const { data: session, status } = useSession();

  const [gig, setGig] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [wompiReady, setWompiReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Cargando...');

  const scriptRef = useRef(false);

  // Load Gig
  useEffect(() => {
    fetch(`/api/gigs/${gigId}`)
      .then(r => r.json())
      .then(setGig)
      .finally(() => setLoading(false));
  }, [gigId]);

  // Create Order - Explicit buyerId
  useEffect(() => {
    if (!gig?.id || !session?.user || status !== 'authenticated') return;

    const buyerId = (session.user as any).id;

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gigId: gig.id,
        buyerId: buyerId,        // ← Explicitly send buyerId
        price: gig.price
      })
    })
      .then(r => r.json())
      .then(data => {
        console.log('Order created:', data);
        setOrder(data);
        setStatusMessage(`✅ Orden creada #${data.id || data.orderId}`);
        toast.success('Orden creada');
      })
      .catch(err => {
        console.error('Order creation failed:', err);
        setStatusMessage('❌ Error creando orden');
        toast.error('Error creando orden');
      });
  }, [gig, session, status]);

  // Load Wompi Widget - More aggressive polling
  useEffect(() => {
    if (scriptRef.current) return;
    scriptRef.current = true;

    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;

    script.onload = () => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if ((window as any).WompiCheckout) {
          clearInterval(interval);
          setWompiReady(true);
          setStatusMessage('✅ Wompi listo - Haz clic para pagar');
          toast.success('Wompi listo');
        }
        if (attempts > 40) {
          clearInterval(interval);
          setStatusMessage('❌ Wompi no disponible');
        }
      }, 120);
    };

    document.head.appendChild(script);
  }, []);

  const handlePayment = () => {
    if (!wompiReady || !order) {
      return toast.error('Espera que todo cargue completamente');
    }

    setSubmitting(true);

    try {
      const checkout = new (window as any).WompiCheckout({
        publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!,
        amountInCents: Math.round(Number(gig.price) * 100),
        currency: 'COP',
        reference: `order_${order.id || order.orderId}`,
        redirectUrl: `${window.location.origin}/orders/${order.id || order.orderId}`,
      });

      checkout.open();
    } catch (e) {
      toast.error('Error al abrir Wompi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-2xl">Cargando checkout...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Checkout - {gig?.title}</h1>

      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7">
          <Card>
            <CardContent className="p-10">
              {gig?.imageUrl && <img src={gig.imageUrl} className="w-full h-64 object-cover rounded-3xl mb-8" />}
              <h2 className="text-4xl font-bold">{gig?.title}</h2>
              <p className="text-5xl font-bold text-orange-600 mt-4">
                ${Number(gig?.price).toLocaleString('es-CO')} COP
              </p>
              <p className="mt-6 text-gray-600 whitespace-pre-line">{gig?.description}</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="sticky top-8">
            <CardContent className="p-10">
              <Button 
                onClick={handlePayment} 
                disabled={!wompiReady || submitting || !order}
                className="w-full py-8 text-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
              >
                {submitting ? 'Procesando...' : wompiReady ? '💳 Pagar con Wompi' : statusMessage}
              </Button>

              <p className="text-center mt-6 text-sm text-gray-500">{statusMessage}</p>
              {order && <p className="text-center text-xs text-green-600 mt-2">Orden creada: #{order.id || order.orderId}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}