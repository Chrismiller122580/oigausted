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
      .then(r => r.json())
      .then(setGig)
      .finally(() => setLoading(false));
  }, [gigId]);

  const loadWompi = (attempt = 1) => {
    setWompiStatus(`Intentando cargar Wompi (${attempt}/5)...`);
    setWompiReady(false);

    // Clean old scripts
    document.querySelectorAll('script[src*="wompi"]').forEach(s => s.remove());

    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    script.onload = () => {
      let checks = 0;
      const interval = setInterval(() => {
        checks++;
        if ((window as any).WompiCheckout) {
          clearInterval(interval);
          setWompiReady(true);
          setWompiStatus('✅ Wompi Listo');
        } else if (checks > 12) {
          clearInterval(interval);
          setWompiStatus('Error - Reintenta');
        }
      }, 400);
    };
    script.onerror = () => setWompiStatus('Error de red');
    document.body.appendChild(script);
  };

  useEffect(() => { loadWompi(); }, []);

  const handlePayment = async () => {
    if (!wompiReady) {
      alert("Wompi no está listo todavía. Usa Reintentar.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gigId: gig.id, price: gig.price })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error creando orden');

      const orderId = data.orderId || data.id;
      const amount = Math.round(gig.price * 100);
      const reference = `order_${orderId}`;

      const checkout = new (window as any).WompiCheckout({
        publicKey: 'pub_test_hhnHHaFm6UYVNyVRg8KdLOmC5wPZsQfZ',
        amountInCents: amount,
        currency: 'COP',
        reference,
        redirectUrl: `${window.location.origin}/orders/${orderId}`,
      });

      checkout.open();
    } catch (e: any) {
      alert(e.message || 'Error al abrir Wompi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
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
                disabled={!wompiReady || submitting}
                className="w-full bg-green-600 hover:bg-green-700 py-8 text-xl rounded-3xl"
              >
                {submitting ? 'Procesando...' : '💳 Pagar con Wompi'}
              </Button>

              <Button onClick={() => loadWompi()} variant="outline" className="w-full mt-4">
                🔄 Reintentar Wompi
              </Button>

              <p className="text-center mt-4 text-sm text-gray-500">
                Estado: {wompiStatus}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
