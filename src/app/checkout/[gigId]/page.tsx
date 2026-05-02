'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
  const [wompiReady, setWompiReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleWompiPayment = () => {
    if (!gig || !session?.user?.id || !wompiReady) return;

    const amountInCents = Math.round(gig.price * 100);
    const reference = `order_${Date.now()}`;

    const checkout = new window.WompiCheckout({
      publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || 'pub_test_hhnHHaFm6UYVNyVRg8KdLOmC5wPZsQfZ',
      amountInCents,
      currency: 'COP',
      reference,
      redirectUrl: `${window.location.origin}/orders/${reference}`,
      // You can add more options like customer data later
    });

    checkout.open();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl">Cargando checkout...</div>;
  if (!gig) return <div className="min-h-screen flex items-center justify-center text-2xl">Gig no encontrado</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8">Checkout</h1>

      <Card>
        <CardContent className="p-10">
          <h2 className="text-3xl font-semibold">{gig.title}</h2>
          <p className="text-5xl font-bold text-orange-600 mt-4">
            ${Number(gig.price).toLocaleString('es-CO')} COP
          </p>

          <div className="mt-12">
            <Button
              onClick={handleWompiPayment}
              disabled={!wompiReady}
              className="w-full bg-green-600 hover:bg-green-700 text-white text-xl py-8 rounded-2xl"
            >
              {wompiReady ? '💳 Pagar con Wompi' : 'Cargando Wompi...'}
            </Button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Pago seguro con Wompi • Transacción en COP
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
