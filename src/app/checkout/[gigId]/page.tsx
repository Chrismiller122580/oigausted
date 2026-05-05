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

  const scriptRef = useRef(false);

  // Load Gig
  useEffect(() => {
    fetch(`/api/gigs/${gigId}`)
      .then(r => r.json())
      .then(setGig)
      .finally(() => setLoading(false));
  }, [gigId]);

  // Auto-create Order
  useEffect(() => {
    if (!gig?.id || !session?.user?.id) return;

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gigId: gig.id,
        buyerId: (session.user as any).id,
        price: gig.price
      })
    })
      .then(r => r.json())
      .then(data => {
        if (data.id) setOrder(data);
      })
      .catch(() => toast.error('Error creando orden'));
  }, [gig, session]);

  // Robust Wompi Loading
  useEffect(() => {
    if (scriptRef.current) return;
    scriptRef.current = true;

    if ((window as any).WompiCheckout) {
      setWompiReady(true);
      setWompiStatus('✅ Listo');
      return;
    }

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
          setWompiStatus('✅ Listo para pagar');
          toast.success('Wompi cargado');
        }
        if (attempts > 25) {
          clearInterval(interval);
          setWompiStatus('❌ Wompi no disponible');
        }
      }, 120);
    };

    document.head.appendChild(script);
  }, []);

  const handlePayment = async () => {
    if (!wompiReady || !order) {
      return toast.error('Espera que Wompi termine de cargar');
    }

    setSubmitting(true);

    try {
      const checkout = new (window as any).WompiCheckout({
        publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || 'pub_test_hhnHHaFm6UYVNyVRg8KdLOmC5wPZsQfZ',
        amountInCents: Math.round(Number(gig.price) * 100),
        currency: 'COP',
        reference: `order_${order.id}`,
        redirectUrl: `${window.location.origin}/orders/${order.id}`,
      });

      checkout.open();
    } catch (error: any) {
      toast.error('Error al abrir Wompi: ' + error.message);
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
              {gig?.imageUrl && <img src={gig.imageUrl} className="w-full h-64 object-cover rounded-3xl mb-8" alt={gig.title} />}
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
                className="w-full py-8 text-xl bg-green-600 hover:bg-green-700"
              >
                {wompiReady ? '💳 Pagar con Wompi' : wompiStatus}
              </Button>

              <Button onClick={() => window.location.reload()} variant="outline" className="w-full mt-4">
                🔄 Recargar
              </Button>

              <p className="text-center mt-6 text-sm text-gray-500">Estado: {wompiStatus}</p>
              {order && <p className="text-center text-xs text-green-600 mt-2">Orden creada: #{order.id}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}