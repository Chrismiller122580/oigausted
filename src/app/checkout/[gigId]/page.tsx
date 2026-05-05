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
  const { data: session } = useSession();

  const [gig, setGig] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [wompiReady, setWompiReady] = useState(false);
  const [wompiStatus, setWompiStatus] = useState('Cargando Wompi...');

  const scriptLoadedRef = useRef(false);

  // 1. Load gig data
  useEffect(() => {
    fetch(`/api/gigs/${gigId}`)
      .then(r => r.json())
      .then(setGig)
      .finally(() => setLoading(false));
  }, [gigId]);

  // 2. Auto-create order (best practice)
  useEffect(() => {
    if (!gig?.id || !session?.user) return;

    const createOrder = async () => {
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gigId: gig.id,
            buyerId: (session.user as any).id,
            price: gig.price
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al crear orden');

        setOrder(data);
      } catch (err: any) {
        toast.error(err.message);
      }
    };

    createOrder();
  }, [gig, session]);

  // 3. Load Wompi script ONCE + reliably
  useEffect(() => {
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    const existingScript = document.querySelector('script[src="https://checkout.wompi.co/widget.js"]');
    if (existingScript) {
      checkWompiReady();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;

    script.onload = () => {
      checkWompiReady();
    };

    script.onerror = () => {
      setWompiStatus('❌ Error al cargar Wompi');
      toast.error('No se pudo cargar Wompi. Reintenta recargando la página.');
    };

    document.body.appendChild(script);

    return () => {
      // cleanup only if you want (rarely needed)
    };
  }, []);

  const checkWompiReady = () => {
    let attempts = 0;
    const maxAttempts = 20;

    const interval = setInterval(() => {
      attempts++;
      if ((window as any).WompiCheckout) {
        clearInterval(interval);
        setWompiReady(true);
        setWompiStatus('✅ Listo para pagar');
        toast.success('Wompi listo');
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        setWompiStatus('❌ Wompi no disponible');
      }
    }, 150);
  };

  const handlePayment = async () => {
    if (!wompiReady || !order) {
      return toast.error('Espera que Wompi termine de cargar');
    }

    setSubmitting(true);

    try {
      const checkout = new (window as any).WompiCheckout({
        publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || 'pub_test_hhnHHaFm6UYVNyVRg8KdLOmC5wPZsQfZ',
        amountInCents: Math.round(gig.price * 100),
        currency: 'COP',
        reference: `order_${order.id}`,
        redirectUrl: `${window.location.origin}/orders/${order.id}`,
        // You can add more options later (customer data, etc.)
      });

      checkout.open();
    } catch (e: any) {
      toast.error(e.message || 'Error al abrir Wompi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !gig) {
    return <div className="p-20 text-center text-2xl">Cargando checkout...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Checkout - {gig.title}</h1>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Gig summary */}
        <div className="lg:col-span-7">
          <Card>
            <CardContent className="p-10">
              {gig.imageUrl && (
                <img
                  src={gig.imageUrl}
                  alt={gig.title}
                  className="w-full h-64 object-cover rounded-3xl mb-8"
                />
              )}
              <h2 className="text-4xl font-bold">{gig.title}</h2>
              <p className="text-5xl font-bold text-orange-600 mt-4">
                ${Number(gig.price).toLocaleString('es-CO')} COP
              </p>
              <p className="mt-6 text-gray-600 whitespace-pre-line">{gig.description}</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment panel */}
        <div className="lg:col-span-5">
          <Card className="sticky top-8">
            <CardContent className="p-10">
              <Button
                onClick={handlePayment}
                disabled={!wompiReady || submitting || !order}
                className="w-full py-8 text-xl bg-green-600 hover:bg-green-700"
              >
                {wompiReady ? '💳 Pagar con Wompi' : wompiStatus}
              </Button>

              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full mt-4"
              >
                🔄 Recargar página
              </Button>

              <p className="text-center mt-6 text-sm text-gray-500">
                Estado: {wompiStatus}
              </p>

              {order && (
                <p className="text-center mt-2 text-xs text-green-600">
                  Orden #{order.id} creada
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}