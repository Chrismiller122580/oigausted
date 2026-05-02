'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, User, Clock } from 'lucide-react';

declare global {
  interface Window {
    WompiCheckout?: any;
  }
}

export default function CheckoutPage() {
  const params = useParams();
  const gigId = params.gigId as string;
  const router = useRouter();
  const { data: session } = useSession();

  const [gig, setGig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [wompiReady, setWompiReady] = useState(false);
  const [customFields, setCustomFields] = useState<Record<string, any>>({});

  useEffect(() => {
    fetch(`/api/gigs/${gigId}`)
      .then(res => res.json())
      .then(data => {
        setGig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [gigId]);

  // Load Wompi script
  useEffect(() => {
    if (window.WompiCheckout) {
      setWompiReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    script.onload = () => setWompiReady(true);
    document.body.appendChild(script);
  }, []);

  const handleWompiPayment = async () => {
    if (!gig || !session?.user?.id || !wompiReady) return;

    setSubmitting(true);

    try {
      // 1. Create the order first
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: gig.id,
          price: gig.price,
          customFields: customFields,
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Error creating order');

      const orderId = orderData.orderId || orderData.id;

      // 2. Open Wompi
      const amountInCents = Math.round(gig.price * 100);
      const reference = `order_${orderId}`;

      const checkout = new window.WompiCheckout({
        publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || 'pub_test_hhnHHaFm6UYVNyVRg8KdLOmC5wPZsQfZ',
        amountInCents,
        currency: 'COP',
        reference,
        redirectUrl: `${window.location.origin}/orders/${orderId}`,
      });

      checkout.open();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Error al procesar el pago');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl">Cargando checkout...</div>;
  if (!gig) return <div className="min-h-screen flex items-center justify-center text-2xl">Gig no encontrado</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Volver
        </Button>
        <h1 className="text-4xl font-bold">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left column - Gig details + smart fields */}
        <div className="lg:col-span-7 space-y-8">
          <Card>
            <CardContent className="p-10">
              {gig.imageUrl && <img src={gig.imageUrl} className="w-full h-64 object-cover rounded-3xl mb-8" alt={gig.title} />}
              <h2 className="text-4xl font-bold">{gig.title}</h2>
              <p className="text-5xl font-bold text-orange-600 mt-4">
                ${Number(gig.price).toLocaleString('es-CO')} COP
              </p>
              <p className="text-gray-600 mt-6 leading-relaxed">{gig.description}</p>

              <div className="flex items-center gap-3 mt-8 text-sm text-gray-500">
                <User size={18} />
                <span>{gig.seller?.businessName || gig.seller?.name || 'Vendedor'}</span>
                <span className="mx-2">•</span>
                <Clock size={18} />
                <span>Entrega en {gig.completionTime || '3'} días</span>
              </div>
            </CardContent>
          </Card>

          {/* Smart buyer fields would go here - we can restore them later if needed */}
        </div>

        {/* Right column - Payment */}
        <div className="lg:col-span-5">
          <Card className="sticky top-8">
            <CardContent className="p-10">
              <h3 className="text-2xl font-semibold mb-6">Resumen del pedido</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Servicio</span>
                  <span className="font-medium">{gig.title}</span>
                </div>
                <div className="flex justify-between text-3xl font-bold border-t pt-6">
                  <span>Total</span>
                  <span className="text-orange-600">
                    ${Number(gig.price).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleWompiPayment}
                disabled={submitting || !wompiReady}
                className="w-full mt-10 bg-green-600 hover:bg-green-700 text-white text-xl py-8 rounded-3xl font-semibold"
              >
                {submitting ? 'Procesando...' : wompiReady ? '💳 Pagar con Wompi' : 'Cargando Wompi...'}
              </Button>

              <p className="text-center text-xs text-gray-500 mt-6">
                Pago seguro • Wompi • Transacción en COP
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
