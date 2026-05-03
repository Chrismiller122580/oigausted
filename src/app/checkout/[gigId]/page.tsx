'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function CheckoutPage() {
  const params = useParams();
  const gigId = params.gigId as string;
  const router = useRouter();
  const { data: session } = useSession();

  const [gig, setGig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [wompiReady, setWompiReady] = useState(false);
  const [wompiStatus, setWompiStatus] = useState('Cargando Wompi...');

  useEffect(() => {
    fetch(`/api/gigs/${gigId}`)
      .then(res => res.json())
      .then(data => {
        setGig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [gigId]);

  const loadWompi = () => {
    setWompiStatus('Intentando cargar...');
    setWompiReady(false);

    // Remove old script if exists
    document.querySelectorAll('script[src*="wompi"]').forEach(s => s.remove());

    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    script.onload = () => {
      setTimeout(() => {
        if ((window as any).WompiCheckout) {
          setWompiReady(true);
          setWompiStatus('✅ Listo para pagar');
        } else {
          setWompiStatus('Error - Reintenta');
        }
      }, 1200);
    };
    script.onerror = () => setWompiStatus('Error de red - Reintenta');
    document.body.appendChild(script);
  };

  useEffect(() => {
    loadWompi();
  }, []);

  const handleWompiPayment = async () => {
    if (!wompiReady) {
      alert("Wompi no está listo. Usa 'Reintentar Wompi'");
      return;
    }

    setSubmitting(true);

    try {
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gigId: gig.id, price: gig.price })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Error creando orden');

      const orderId = orderData.orderId || orderData.id;
      const amountInCents = Math.round(gig.price * 100);
      const reference = `order_${orderId}`;

      const checkout = new (window as any).WompiCheckout({
        publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || 'pub_test_hhnHHaFm6UYVNyVRg8KdLOmC5wPZsQfZ',
        amountInCents,
        currency: 'COP',
        reference,
        redirectUrl: `${window.location.origin}/orders/${orderId}`,
      });

      checkout.open();
    } catch (error: any) {
      alert(error.message || 'Error al abrir Wompi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl">Cargando checkout...</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8">Checkout - {gig?.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7">
          <Card>
            <CardContent className="p-10">
              {gig?.imageUrl && <img src={gig.imageUrl} className="w-full h-64 object-cover rounded-3xl mb-8" alt={gig.title} />}
              <h2 className="text-4xl font-bold">{gig?.title}</h2>
              <p className="text-5xl font-bold text-orange-600 mt-4">
                ${Number(gig?.price).toLocaleString('es-CO')} COP
              </p>
              <p className="text-gray-600 mt-6 leading-relaxed whitespace-pre-line">{gig?.description}</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="sticky top-8">
            <CardContent className="p-10">
              <Button
                onClick={handleWompiPayment}
                disabled={submitting || !wompiReady}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-xl py-8 rounded-3xl font-semibold mb-4"
              >
                {submitting ? 'Procesando...' : wompiReady ? '💳 Pagar con Wompi' : 'Wompi no listo'}
              </Button>

              <Button onClick={loadWompi} variant="outline" className="w-full">
                🔄 Reintentar Wompi
              </Button>

              <p className="text-center text-sm mt-4 text-gray-500">
                Estado: {wompiStatus}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
